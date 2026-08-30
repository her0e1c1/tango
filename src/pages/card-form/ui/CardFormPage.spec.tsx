import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createCard as createRemoteCard, createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
  beforeCardWrite: undefined as (() => Promise<void>) | undefined,
  skipCardWrite: false,
  remoteCard: undefined as Card | undefined,
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
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
    editCard: async (...args: Parameters<typeof actual.editCard>) => {
      await mocks.beforeCardWrite?.();
      if (mocks.skipCardWrite) return;
      return actual.editCard(...args);
    },
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardFormPage } from "./CardFormPage";

describe("CardFormPage", () => {
  const deckId = "card-form-deck";
  const cardId = "card-id";
  const renderPage = (path = `/card/${cardId}/edit`) => {
    const router = createMemoryRouter(
      [
        { path: "/previous", element: <h1>Previous page</h1> },
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/deck/:id", element: <h1>Card list</h1> },
        { path: "/card/:id/edit", element: <CardFormPage /> },
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
    mocks.beforeCardWrite = undefined;
    mocks.skipCardWrite = false;
    mocks.remoteCard = undefined;
    await createDeck("", createLocalDeck({ id: deckId }));
    await mutateCards("", [
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

  it("initializes the editor when the route Card arrives after mount", async () => {
    const delayedCardId = "delayed-card";
    renderPage(`/card/${delayedCardId}/edit`);

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    await actAsync(async () => {
      await mutateCards("", [
        {
          kind: "create",
          card: createLocalCard({ id: delayedCardId, deckId, frontText: "Delayed front", backText: "Delayed back" }),
        },
      ]);
    });

    expect(screen.getByRole("textbox", { name: "Front text" })).toHaveValue("Delayed front");
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

  it("keeps a remote Card protected and non-submittable across a pending optimistic snapshot", async () => {
    let rejectWrite: (error: Error) => void = () => undefined;
    mocks.beforeCardWrite = () =>
      new Promise<void>((_resolve, reject) => {
        rejectWrite = reject;
      });
    mocks.skipCardWrite = true;
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    const view = renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Retry front", backText: "Back text" });
    view.rerenderRouter();

    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Keep editing" }));

    await actAsync(async () => rejectWrite(new Error("write failed")));
    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    view.rerenderRouter();

    expect(frontText).toHaveValue("Retry front");
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("keeps the confirmed Card baseline when a retry fails before the delayed rollback", async () => {
    const rejectWrites: Array<(error: Error) => void> = [];
    const rejectWrite = (index: number) => {
      const reject = rejectWrites[index];
      if (reject === undefined) throw new Error(`missing write ${index}`);
      reject(new Error("write failed"));
    };
    mocks.beforeCardWrite = () =>
      new Promise<void>((_resolve, reject) => {
        rejectWrites.push(reject);
      });
    mocks.skipCardWrite = true;
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    const view = renderPage();
    const frontText = screen.getByRole("textbox", { name: "Front text" });
    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Retry front");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Retry front", backText: "Back text" });
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

    mocks.remoteCard = createRemoteCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" });
    view.rerenderRouter();
    expect(frontText).toHaveValue("Retry front");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
  });

  it("keeps edits made after a remote Card submission when that submission succeeds", async () => {
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
    mocks.remoteCard = createRemoteCard({
      id: cardId,
      deckId,
      frontText: "Submitted front",
      backText: "Back text",
    });
    view.rerenderRouter();

    await userEvent.clear(frontText);
    await userEvent.type(frontText, "Later front");
    await actAsync(async () => resolveWrite());

    expect(await screen.findByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(screen.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
    expect(frontText).toHaveValue("Later front");
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("alertdialog", { name: "Discard unsaved changes?" })).toBeVisible();
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
          <CardFormPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid card id");
  });
});
