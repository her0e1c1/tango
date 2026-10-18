import "@/test/mockFirestorePersistence";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck, getDecks } from "@/entities/deck";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createDeck as createRemoteDeck, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
  beforeDeckWrite: undefined as (() => Promise<void>) | undefined,
  skipDeckWrite: false,
  beforeDeckDelete: undefined as (() => Promise<void>) | undefined,
  remoteDeck: undefined as Deck | undefined,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id", useAuth: () => ({ isAnonymous: false }) }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    useDeck(id: Parameters<typeof actual.useDeck>[0]) {
      const storedDeck = actual.useDeck(id);
      return mocks.remoteDeck?.id === id ? mocks.remoteDeck : storedDeck;
    },
    deleteDeck: async (...args: Parameters<typeof actual.deleteDeck>) => {
      await mocks.beforeDeckDelete?.();
      return actual.deleteDeck(...args);
    },
    editDeck: async (...args: Parameters<typeof actual.editDeck>) => {
      await mocks.beforeDeckWrite?.();
      if (mocks.skipDeckWrite) return;
      return actual.editDeck(...args);
    },
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckEditPage } from "./DeckEditPage";

describe("DeckEditPage (DECK-MANAGEMENT-01 DECK-MANAGEMENT-02 DECK-MANAGEMENT-03 NAVIGATION-07 DECK-MANAGEMENT-08)", () => {
  const deckId = "deck-id";
  const renderPage = (path = `/deck/${deckId}/edit`) => {
    const router = createMemoryRouter(
      [
        { path: "/previous", element: <h1>Previous page</h1> },
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/deck/:id/edit", element: <DeckEditPage /> },
      ],
      { initialEntries: ["/previous", path], initialIndex: 1 }
    );
    const renderRouter = () => (
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const view = render(renderRouter());
    return Object.assign(view, { router, rerenderRouter: () => view.rerender(renderRouter()) });
  };

  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.beforeDeckWrite = undefined;
    mocks.skipDeckWrite = false;
    mocks.beforeDeckDelete = undefined;
    mocks.remoteDeck = undefined;
    await createDeck("user-id", createLocalDeck({ id: deckId, name: "Deck name", category: "", convertToBr: false }));
  });

  it("renders the stored deck editor in the application shell", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("initializes the editor when the route Deck arrives after mount", async () => {
    // Given: Prepare `delayedDeckId` and any shared test state below.
    const delayedDeckId = "delayed-deck";
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage(`/deck/${delayedDeckId}/edit`);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await createDeck("user-id", createLocalDeck({ id: delayedDeckId, name: "Delayed deck" }));
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Delayed deck");
  });

  it("resets page-owned state when navigating to a different Deck", async () => {
    // Given: Prepare `nextDeckId`, `router` and any shared test state below.
    const nextDeckId = "next-deck";
    await createDeck("user-id", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    const router = createMemoryRouter(
      [
        {
          path: "/deck/:id/edit",
          element: (
            <>
              <Link to={`/deck/${nextDeckId}/edit`}>Next deck</Link>
              <DeckEditPage />
            </>
          ),
        },
      ],
      { initialEntries: [`/deck/${deckId}/edit`] }
    );
    render(<RouterProvider router={router} />);

    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Unsaved name");

    await userEvent.click(screen.getByRole("link", { name: "Next deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Next deck");
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it.each([false, true])("saves other fields without changing legacy convertToBr=%s", async (convertToBr) => {
    // Given: Use this case's inputs and any shared test setup.
    await createDeck("user-id", createLocalDeck({ id: deckId, name: "Deck name", category: "", convertToBr }));
    renderPage();
    expect(screen.queryByRole("checkbox", { name: "Convert line breaks", hidden: true })).not.toBeInTheDocument();
    expect(screen.queryByText("More settings")).not.toBeInTheDocument();

    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Saved deck");
    await userEvent.selectOptions(screen.getByRole("combobox"), "math");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Updated deck “Saved deck”.")).toBeVisible();
    expect(getDecks().find((deck) => deck.id === deckId)).toMatchObject({
      name: "Saved deck",
      category: "math",
      convertToBr,
    });
  });

  it("navigates to the deck list after cancellation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("blocks cancellation while the Deck form is dirty", async () => {
    // Given: Prepare `name` and any shared test state below.
    renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Back to decks" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    // Then: Verify the expected result in the assertions below.
    expect(name).toHaveValue("Unsaved deck");
  });

  it("keeps the opening Deck snapshot and disables the editor while saving", async () => {
    // Given: Prepare `resolveWrite`, `view`, `name` and any shared test state below.
    let resolveWrite: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });
    mocks.skipDeckWrite = true;
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, "Submitted deck");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Subscription deck" });
    // When: Exercise `view.rerenderRouter` with the prepared inputs.
    view.rerenderRouter();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(name).toHaveValue("Submitted deck");
    expect(screen.getByRole("button", { name: "Back to decks" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete deck" })).toBeDisabled();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => resolveWrite());

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("does not navigate when saving finishes after the Page unmounts", async () => {
    // Given: Prepare `resolveWrite`, `view` and any shared test state below.
    let resolveWrite: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });
    mocks.skipDeckWrite = true;
    const view = renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    const openingPath = view.router.state.location.pathname;
    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    await actAsync(async () => resolveWrite());

    // Then: Verify the expected result in the assertions below.
    expect(view.router.state.location.pathname).toBe(openingPath);
  });

  it("shows navigation confirmation above an open deletion dialog", async () => {
    // Given: Prepare `view`, `name` and any shared test state below.
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Delete deck?" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => {
      await view.router.navigate(-1);
    });

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Delete deck?" })).toBeVisible();
    expect(name).toHaveValue("Unsaved deck");
  });

  it("deletes the deck from its settings page after confirmation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    // Then: Verify the expected result in the assertions below.
    expect(dialog).toHaveTextContent("Deck name");
    expect(dialog).toHaveTextContent("This permanently deletes 0 cards in this deck.");

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();

    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Unsaved before deletion");
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog", { name: "Delete deck?" })).getByRole("button", { name: "Delete deck" })
    );

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Deleted deck “Deck name”.")).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("keeps the new deletion dialog pending when an earlier visit finishes", async () => {
    // Given: Prepare `nextDeckId`, `finishOldDelete`, `view` and any shared test state below.
    const nextDeckId = "next-deletion-deck";
    await createDeck("user-id", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    let finishOldDelete: () => void = () => undefined;
    mocks.beforeDeckDelete = () =>
      new Promise<void>((resolve) => {
        finishOldDelete = resolve;
      });
    const view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog", { name: "Delete deck?" })).getByRole("button", { name: "Delete deck" })
    );
    view.unmount();

    let finishNewDelete: () => void = () => undefined;
    mocks.beforeDeckDelete = () =>
      new Promise<void>((resolve) => {
        finishNewDelete = resolve;
      });
    renderPage(`/deck/${nextDeckId}/edit`);
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    // Then: Verify the expected result in the assertions below.
    expect(dialog).toHaveTextContent("Next deck");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(within(dialog).getByRole("button", { name: "Delete deck" }));

    await actAsync(async () => finishOldDelete());
    // Then: Verify the expected result in the assertions below.
    expect(dialog).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.queryByText("Deleted deck “Deck name”.")).not.toBeInTheDocument();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => finishNewDelete());
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Deleted deck “Next deck”.")).toBeVisible();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage("/deck/missing-deck/edit");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage("/deck/missing-deck/edit");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `render` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() =>
      render(
        <MemoryRouter>
          <DeckEditPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
