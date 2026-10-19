import "@/test/mockFirestorePersistence";
import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createCard, editCard, getCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createCard as createRemoteCard, createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
  beforeCardWrite: undefined as (() => Promise<void>) | undefined,
  skipCardWrite: false,
  beforeValidation: undefined as (() => Promise<void>) | undefined,
  remoteCard: undefined as Card | undefined,
}));

vi.mock("@hookform/resolvers/zod", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@hookform/resolvers/zod")>();
  return {
    zodResolver: (...args: Parameters<typeof actual.zodResolver>) => {
      const resolve = actual.zodResolver(...args);
      return async (...input: Parameters<typeof resolve>) => {
        await mocks.beforeValidation?.();
        return resolve(...input);
      };
    },
  };
});

vi.mock("@/entities/auth", () => ({
  getAuthUid: () => "user-id",
}));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/entities/card", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/card")>();
  return {
    ...actual,
    useCard(id: Parameters<typeof actual.useCard>[0]) {
      const storedCard = actual.useCard(id);
      return mocks.remoteCard?.id === id ? mocks.remoteCard : storedCard;
    },
    editCard: vi.fn(async (...args: Parameters<typeof actual.editCard>) => {
      await mocks.beforeCardWrite?.();
      if (mocks.skipCardWrite) return;
      return actual.editCard(...args);
    }),
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardEditPage } from "./CardEditPage";

describe("CARD-MANAGEMENT-01 CARD-MANAGEMENT-04 CARD-VIEW-05 CARD-MANAGEMENT-09 CARD-MANAGEMENT-10 CARD-MANAGEMENT-18 CARD-MANAGEMENT-19 CARD-MANAGEMENT-20 CARD-MANAGEMENT-21 CardEditPage", () => {
  const deckId = "card-edit-deck";
  const cardId = "card-id";
  const renderPage = (path = `/card/${cardId}/edit`) => {
    const router = createMemoryRouter(
      [
        { path: "/previous", element: <h1>Previous page</h1> },
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/deck/:id", element: <h1>Card list</h1> },
        { path: "/card/:id/edit", element: <CardEditPage /> },
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
    replaceRemoteCards([]);
    dismissToast();
    vi.mocked(editCard).mockClear();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.beforeCardWrite = undefined;
    mocks.skipCardWrite = false;
    mocks.beforeValidation = undefined;
    mocks.remoteCard = undefined;
    await createDeck("user-id", createLocalDeck({ id: deckId }));
    await createCard(
      "user-id",
      createLocalCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" })
    );
  });

  it("renders the stored card editor in the application shell", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `renderPage` with the prepared inputs.
    renderPage();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front text");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("CARD-MANAGEMENT-01 CARD-MANAGEMENT-18 saves same-Deck Card tag selections while preserving existing Card tags", async () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceRemoteDecks([createLocalDeck({ id: deckId }), createLocalDeck({ id: "other-deck" })]);
    await createCard("user-id", createLocalCard({ id: "source", deckId, tags: ["chapter-1", "exam"] }));
    await createCard("user-id", createLocalCard({ id: "other", deckId: "other-deck", tags: ["other-only"] }));
    await editCard("user-id", { id: cardId, tags: ["legacy"] });
    renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));

    // Then: Verify the expected result in the assertions below.
    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.queryByRole("checkbox", { name: "math" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "other-only" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "exam" }));
    await userEvent.click(screen.getByRole("button", { name: "Close tag editor" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "exam" })).toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Close tag editor" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
    expect(getCards().find((card) => card.id === cardId)?.tags).toEqual(["legacy", "exam"]);
  });

  it("CARD-MANAGEMENT-01 CARD-MANAGEMENT-18 retains existing tags when no other Card supplies candidates", async () => {
    // Given: Use this case's inputs and any shared test setup.
    replaceRemoteDecks([createLocalDeck({ id: deckId })]);
    await editCard("user-id", { id: cardId, tags: ["legacy"] });
    renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "legacy" })).not.toBeChecked();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
  });

  it("initializes the editor when the route Card arrives after mount", async () => {
    // Given: Prepare `delayedCardId` and any shared test state below.
    const delayedCardId = "delayed-card";
    renderPage(`/card/${delayedCardId}/edit`);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    // When: Deliver the route's Card after the editor has mounted.
    await actAsync(async () => {
      await createCard(
        "user-id",
        createLocalCard({ id: delayedCardId, deckId, frontText: "Delayed front", backText: "Delayed back" })
      );
    });

    // Then: Initialize the editor from the arriving Card.
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Delayed front");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Delayed back");
  });

  it("replaces the editor with its Card list after saving", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage();

    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Saved front");
    await actAsync(async () => {
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    });

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Card list" })).toBeVisible();
    expect(view.router.state.location.pathname).toBe(`/deck/${deckId}`);
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => view.router.navigate(-1));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
    expect(screen.getByText("Updated card “Saved front”.")).toBeVisible();
  });

  it("returns to the previous page after cancellation", async () => {
    // Given: Use this case's inputs and any shared test setup.
    renderPage();

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("protects dirty Card input when cancellation is requested", async () => {
    // Given: Prepare `frontText` and any shared test state below.
    renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Unsaved front");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    // Then: Verify the expected result in the assertions below.
    expect(frontText).toHaveValue("Unsaved front");
  });

  it("keeps the opening Card snapshot and stays pending until the submitted snapshot is observed", async () => {
    // Given: Prepare `resolveWrite`, `view`, `frontText` and any shared test state below.
    let resolveWrite: () => void = () => undefined;
    mocks.beforeCardWrite = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });
    mocks.skipCardWrite = true;
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    const view = renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Submitted front");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Subscription front", backText: "Back text" });
    // When: Exercise `view.rerenderRouter` with the prepared inputs.
    view.rerenderRouter();

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(frontText).toHaveValue("Submitted front");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => resolveWrite());

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
  });

  it("disables repeated save attempts during validation and persistence", async () => {
    // Given: Prepare `validation`, `write`, `view` and any shared test state below.
    const validation = Promise.withResolvers<void>();
    const write = Promise.withResolvers<void>();
    mocks.beforeValidation = () => validation.promise;
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    const save = screen.getByRole("button", { name: "Save changes" });

    // When: Exercise `userEvent.dblClick` with the prepared inputs.
    await userEvent.dblClick(save);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(front).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(save);
    await actAsync(async () => validation.resolve());
    // Then: Verify the expected result in the assertions below.
    expect(save).toBeDisabled();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(save);
    await actAsync(async () => write.resolve());

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Updated card “Front text”.")).toBeVisible();
    expect(editCard).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: cardId,
      frontText: "Front text",
      backText: "Back text",
      tags: [],
    });
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => view.router.navigate(-1));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();
  });

  it("keeps edited values after a failed save and allows an explicit retry", async () => {
    // Given: Prepare `write`, `front` and any shared test state below.
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(front);
    await userEvent.type(front, "Edited front");
    const save = screen.getByRole("button", { name: "Save changes" });
    await userEvent.dblClick(save);
    await actAsync(async () => write.reject(new Error("write failed")));
    mocks.beforeCardWrite = undefined;

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(save).toBeEnabled();
    expect(front).toHaveValue("Edited front");
    expect(editCard).toHaveBeenCalledOnce();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(save);
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Updated card “Edited front”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it("allows corrected values to be saved after validation fails", async () => {
    // Given: Prepare `front` and any shared test state below.
    renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(front);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(editCard).not.toHaveBeenCalled();
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(front, "Corrected front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Updated card “Corrected front”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it("does not revive the editor after a late success", async () => {
    // Given: Prepare `write`, `view` and any shared test state below.
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await actAsync(async () => view.router.navigate("/previous"));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => write.resolve());

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Updated card “Front text”.")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Previous page" })).toBeVisible();
  });

  it("does not revive the editor after a late failure", async () => {
    // Given: Prepare `write`, `view` and any shared test state below.
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await actAsync(async () => view.router.navigate("/previous"));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();

    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => write.reject(new Error("write failed")));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Previous page" })).toBeVisible();
  });

  it("initializes a different Card and ignores navigation from the previous Card's save", async () => {
    // Given: Prepare `write`, `view` and any shared test state below.
    await createCard(
      "user-id",
      createLocalCard({ id: "other-card", deckId, frontText: "Other front", backText: "Other back" })
    );
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await actAsync(async () => view.router.navigate("/card/other-card/edit"));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("textbox", { name: "Front text" })).toHaveValue("Other front");
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => write.resolve());
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByText("Updated card “Front text”.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Other front");
    expect(view.router.state.location.pathname).toBe("/card/other-card/edit");
  });

  it("retains the shared failure toast when cancelling and unmounting the editor", async () => {
    // Given: Use this case's inputs and any shared test setup.
    mocks.beforeCardWrite = () => Promise.reject(new Error("write failed"));
    renderPage();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
  });

  it("navigates with both recovery actions when the card is unavailable", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = renderPage("/card/missing-card/edit");

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    // When: Exercise `view.unmount` with the prepared inputs.
    view.unmount();
    renderPage("/card/missing-card/edit");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a card id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Evaluate `render` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(() =>
      render(
        <MemoryRouter>
          <CardEditPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid card id");
  });
});
