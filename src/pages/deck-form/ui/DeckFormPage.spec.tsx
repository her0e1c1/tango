import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createDeck as createRemoteDeck, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
  beforeDeckWrite: undefined as (() => Promise<void>) | undefined,
  skipDeckWrite: false,
  remoteDeck: undefined as Deck | undefined,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
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
    editDeck: async (...args: Parameters<typeof actual.editDeck>) => {
      await mocks.beforeDeckWrite?.();
      if (mocks.skipDeckWrite) return;
      return actual.editDeck(...args);
    },
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckFormPage } from "./DeckFormPage";

describe("DeckFormPage", () => {
  const deckId = "deck-id";
  const renderPage = (path = `/deck/${deckId}/edit`) => {
    const router = createMemoryRouter(
      [
        { path: "/previous", element: <h1>Previous page</h1> },
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/deck/:id/edit", element: <DeckFormPage /> },
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
    dismissToast();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.beforeDeckWrite = undefined;
    mocks.skipDeckWrite = false;
    mocks.remoteDeck = undefined;
    await createDeck("", createLocalDeck({ id: deckId, name: "Deck name", category: "", convertToBr: false }));
  });

  it("renders the stored deck editor in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("initializes the editor when the route Deck arrives after mount", async () => {
    const delayedDeckId = "delayed-deck";
    renderPage(`/deck/${delayedDeckId}/edit`);

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    await actAsync(async () => {
      await createDeck("", createLocalDeck({ id: delayedDeckId, name: "Delayed deck" }));
    });

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Delayed deck");
  });

  it("resets page-owned state when navigating to a different Deck", async () => {
    const nextDeckId = "next-deck";
    await createDeck("", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    const router = createMemoryRouter(
      [
        {
          path: "/deck/:id/edit",
          element: (
            <>
              <Link to={`/deck/${nextDeckId}/edit`}>Next deck</Link>
              <DeckFormPage />
            </>
          ),
        },
      ],
      { initialEntries: [`/deck/${deckId}/edit`] }
    );
    render(<RouterProvider router={router} />);

    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Unsaved name");

    await userEvent.click(screen.getByRole("link", { name: "Next deck" }));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));

    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Next deck");
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("navigates to the deck list after saving", async () => {
    renderPage();

    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Saved deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Updated deck “Saved deck”.")).toBeVisible();
  });

  it("navigates to the deck list after cancellation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("blocks cancellation while the Deck form is dirty", async () => {
    renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(name).toHaveValue("Unsaved deck");
  });

  it("keeps a remote Deck protected and non-submittable across a pending optimistic snapshot", async () => {
    let rejectWrite: (error: Error) => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      });
    mocks.skipDeckWrite = true;
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Retry deck" });
    view.rerenderRouter();

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    await actAsync(async () => rejectWrite(new Error("write failed")));
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    view.rerenderRouter();

    expect(name).toHaveValue("Retry deck");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("keeps the confirmed Deck baseline when a retry fails before the delayed rollback", async () => {
    const rejectWrites: Array<(error: Error) => void> = [];
    const rejectWrite = (index: number) => {
      const reject = rejectWrites[index];
      if (reject === undefined) throw new Error(`missing write ${index}`);
      reject(new Error("write failed"));
    };
    mocks.beforeDeckWrite = () =>
      new Promise<void>((_resolve, reject) => {
        rejectWrites.push(reject);
      });
    mocks.skipDeckWrite = true;
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Retry deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Retry deck" });
    view.rerenderRouter();

    await actAsync(async () => {
      rejectWrite(0);
      await Promise.resolve();
    });
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    await actAsync(async () => {
      rejectWrite(1);
      await Promise.resolve();
    });
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();

    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    view.rerenderRouter();
    expect(name).toHaveValue("Retry deck");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("keeps edits made after a remote Deck submission when that submission succeeds", async () => {
    let resolveWrite: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });
    mocks.skipDeckWrite = true;
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Deck name" });
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Submitted deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteDeck = createRemoteDeck({ id: deckId, name: "Submitted deck" });
    view.rerenderRouter();

    await userEvent.clear(name);
    await userEvent.type(name, "Later deck");
    await actAsync(async () => resolveWrite());

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(screen.getByRole("heading", { level: 1, name: "Submitted deck" })).toBeVisible();
    expect(name).toHaveValue("Later deck");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("shows navigation confirmation above an open deletion dialog", async () => {
    const view = renderPage();
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.type(name, "Unsaved deck");
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    expect(screen.getByRole("alertdialog", { name: "Delete deck?" })).toBeVisible();

    await actAsync(async () => {
      await view.router.navigate(-1);
    });

    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Delete deck?" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.getByRole("alertdialog", { name: "Delete deck?" })).toBeVisible();
    expect(name).toHaveValue("Unsaved deck");
  });

  it("deletes the deck from its settings page after confirmation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveTextContent("Deck name");
    expect(dialog).toHaveTextContent("This permanently deletes 0 cards in this deck.");

    await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();

    await userEvent.clear(screen.getByRole("textbox", { name: "Name" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Name" }), "Unsaved before deletion");
    await userEvent.click(screen.getByRole("button", { name: "Delete deck" }));
    await userEvent.click(
      within(screen.getByRole("alertdialog", { name: "Delete deck?" })).getByRole("button", { name: "Delete deck" })
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Deleted deck “Deck name”.")).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Discard unsaved changes?" })).not.toBeInTheDocument();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    const view = renderPage("/deck/missing-deck/edit");

    expect(screen.getByRole("heading", { level: 1, name: "Deck not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    view.unmount();
    renderPage("/deck/missing-deck/edit");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <DeckFormPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
