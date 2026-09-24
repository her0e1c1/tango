import "@/test/mockFirestorePersistence";
import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { editCard, getCards, mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { replaceRemoteDecks } from "@/test/entityFixtures";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
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

describe("CARD-MANAGEMENT-01 CARD-MANAGEMENT-04 CARD-VIEW-05 CARD-MANAGEMENT-09 CARD-MANAGEMENT-10 CardEditPage", () => {
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
    dismissToast();
    vi.mocked(editCard).mockClear();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.beforeCardWrite = undefined;
    mocks.skipCardWrite = false;
    mocks.beforeValidation = undefined;
    mocks.remoteCard = undefined;
    await createDeck("user-id", createLocalDeck({ id: deckId }));
    await mutateCards("user-id", [
      {
        kind: "create",
        card: createLocalCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" }),
      },
    ]);
  });

  it("renders the stored card editor in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Front text");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("CARD-MANAGEMENT-01 saves Deck tag selections while preserving existing Card tags", async () => {
    replaceRemoteDecks([
      createLocalDeck({ id: deckId, tags: ["chapter-1", "exam"] }),
      createLocalDeck({ id: "other-deck", tags: ["other-only"] }),
    ]);
    await editCard("user-id", { id: cardId, tags: ["legacy"] });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.queryByRole("checkbox", { name: "math" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "other-only" })).not.toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "exam" }));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    expect(screen.getByRole("checkbox", { name: "exam" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
    expect(getCards().find((card) => card.id === cardId)?.tags).toEqual(["legacy", "exam"]);
  });

  it.each([undefined, []])("CARD-MANAGEMENT-01 retains existing Card tags when Deck tags are %s", async (tags) => {
    replaceRemoteDecks([createLocalDeck({ id: deckId, ...(tags ? { tags } : {}) })]);
    await editCard("user-id", { id: cardId, tags: ["legacy"] });
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Edit tags" }));
    expect(screen.getAllByRole("checkbox")).toHaveLength(1);
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    expect(screen.getByRole("checkbox", { name: "legacy" })).not.toBeChecked();
    await userEvent.click(screen.getByRole("checkbox", { name: "legacy" }));
    expect(screen.getByRole("checkbox", { name: "legacy" })).toBeChecked();
  });

  it("initializes the editor when the route Card arrives after mount", async () => {
    const delayedCardId = "delayed-card";
    renderPage(`/card/${delayedCardId}/edit`);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    await actAsync(async () => {
      await mutateCards("user-id", [
        {
          kind: "create",
          card: createLocalCard({ id: delayedCardId, deckId, frontText: "Delayed front", backText: "Delayed back" }),
        },
      ]);
    });

    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Delayed front");
    await userEvent.click(screen.getByRole("tab", { name: "Back" }));
    expect(screen.getByRole("textbox", { name: "Back text" })).toHaveValue("Delayed back");
  });

  it("replaces the editor with its Card list after saving", async () => {
    const view = renderPage();

    await userEvent.clear(screen.getByRole("textbox", { name: "Front text" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Front text" }), "Saved front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Card list" })).toBeVisible();
    expect(view.router.state.location.pathname).toBe(`/deck/${deckId}`);
    await actAsync(async () => view.router.navigate(-1));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
    expect(screen.getByText("Updated card “Saved front”.")).toBeVisible();
  });

  it("returns to the previous page after cancellation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("protects dirty Card input when cancellation is requested", async () => {
    renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Unsaved front");

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    expect(frontText).toHaveValue("Unsaved front");
  });

  it("keeps the opening Card snapshot and stays pending until the submitted snapshot is observed", async () => {
    let resolveWrite: () => void = () => undefined;
    mocks.beforeCardWrite = () =>
      new Promise<void>((resolve) => {
        resolveWrite = resolve;
      });
    mocks.skipCardWrite = true;
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    const view = renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Submitted front");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Subscription front", backText: "Back text" });
    view.rerenderRouter();

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(frontText).toHaveValue("Submitted front");
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    await actAsync(async () => resolveWrite());

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(screen.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
  });

  it("disables repeated save attempts during validation and persistence", async () => {
    const validation = Promise.withResolvers<void>();
    const write = Promise.withResolvers<void>();
    mocks.beforeValidation = () => validation.promise;
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    const save = screen.getByRole("button", { name: "Save changes" });

    await userEvent.dblClick(save);
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(front).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    await userEvent.click(save);
    await actAsync(async () => validation.resolve());
    expect(save).toBeDisabled();
    await userEvent.click(save);
    await actAsync(async () => write.resolve());

    expect(await screen.findByText("Updated card “Front text”.")).toBeVisible();
    expect(editCard).toHaveBeenCalledExactlyOnceWith("user-id", {
      id: cardId,
      frontText: "Front text",
      backText: "Back text",
      tags: [],
    });
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
    await actAsync(async () => view.router.navigate(-1));
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();
  });

  it("keeps edited values after a failed save and allows an explicit retry", async () => {
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(front);
    await userEvent.type(front, "Edited front");
    const save = screen.getByRole("button", { name: "Save changes" });
    await userEvent.dblClick(save);
    await actAsync(async () => write.reject(new Error("write failed")));
    mocks.beforeCardWrite = undefined;

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(save).toBeEnabled();
    expect(front).toHaveValue("Edited front");
    expect(editCard).toHaveBeenCalledOnce();
    await userEvent.click(save);
    expect(await screen.findByText("Updated card “Edited front”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it("allows corrected values to be saved after validation fails", async () => {
    renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(front);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(editCard).not.toHaveBeenCalled();
    await userEvent.type(front, "Corrected front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Updated card “Corrected front”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it.each(["success", "failure"] as const)(
    "does not revive the editor after a late %s",
    async (outcome) => {
      const write = Promise.withResolvers<void>();
      mocks.beforeCardWrite = () => write.promise;
      const view = renderPage();
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      await actAsync(async () => view.router.navigate("/previous"));
      await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
      expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();

      await actAsync(async () => (outcome === "failure" ? write.reject(new Error("write failed")) : write.resolve()));

      if (outcome === "failure") expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
      else expect(screen.queryByText("Updated card “Front text”.")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Previous page" })).toBeVisible();
    }
  );

  it("initializes a different Card and ignores navigation from the previous Card's save", async () => {
    await mutateCards("user-id", [
      {
        kind: "create",
        card: createLocalCard({ id: "other-card", deckId, frontText: "Other front", backText: "Other back" }),
      },
    ]);
    const write = Promise.withResolvers<void>();
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await actAsync(async () => view.router.navigate("/card/other-card/edit"));
    await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
    expect(await screen.findByRole("textbox", { name: "Front text" })).toHaveValue("Other front");
    await actAsync(async () => write.resolve());
    expect(screen.queryByText("Updated card “Front text”.")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Other front");
    expect(view.router.state.location.pathname).toBe("/card/other-card/edit");
  });

  it("retains the shared failure toast when cancelling and unmounting the editor", async () => {
    mocks.beforeCardWrite = () => Promise.reject(new Error("write failed"));
    renderPage();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();
    expect(screen.getByText("Unable to save changes. Try again.")).toBeVisible();
  });

  it("navigates with both recovery actions when the card is unavailable", async () => {
    const view = renderPage("/card/missing-card/edit");

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();

    view.unmount();
    renderPage("/card/missing-card/edit");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a card id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <CardEditPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid card id");
  });
});
