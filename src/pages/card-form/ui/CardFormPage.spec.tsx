import type { Card } from "@/entities/card";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { editCard, mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
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
  getAuthSession: () => ({ status: "authenticated", uid: "user-id", displayName: null, isAnonymous: false }),
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

import { CardFormPage } from "./CardFormPage";

describe("CARD-03 CARD-09 CARD-12 CARD-17 CARD-21 CardFormPage", () => {
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
    vi.mocked(editCard).mockClear();
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    mocks.beforeCardWrite = undefined;
    mocks.skipCardWrite = false;
    mocks.beforeValidation = undefined;
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

  it("keeps the opening Card snapshot and disables the editor while saving", async () => {
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

    expect(await screen.findByRole("heading", { level: 1, name: "Card list" })).toBeVisible();
  });

  const startRepeatedSubmission = async (invalid = false) => {
    const validation = Promise.withResolvers<void>();
    const duplicateValidation = Promise.withResolvers<void>();
    const write = Promise.withResolvers<void>();
    // A duplicate validation may complete after the first request has already failed.
    let validationStarted = false;
    mocks.beforeValidation = () => {
      const pending = validationStarted ? duplicateValidation : validation;
      validationStarted = true;
      return pending.promise;
    };
    mocks.beforeCardWrite = () => write.promise;
    const view = renderPage();
    const front = screen.getByRole("textbox", { name: "Front text" });
    if (invalid) await userEvent.clear(front);
    const { form } = screen.getByRole<HTMLButtonElement>("button", { name: "Save changes" });
    if (form === null) throw new Error("Save button must belong to a form");

    await actAsync(async () => {
      fireEvent.submit(form);
      fireEvent.submit(form);
      // Flush the same-tick events while asynchronous validation is still pending.
      await Promise.resolve();
    });
    return { view, front, form, write, validation, duplicateValidation };
  };

  it("saves once for repeated submissions before render and during validation and persistence", async () => {
    const { view, front, form, write, validation, duplicateValidation } = await startRepeatedSubmission();
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    expect(front).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Back to cards" })).toBeDisabled();
    fireEvent.submit(form);
    await actAsync(async () => validation.resolve());
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    fireEvent.submit(form);
    await actAsync(async () => write.resolve());
    await actAsync(async () => duplicateValidation.resolve());

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

  it("does not save from stale duplicate validation after failure, but allows an explicit retry", async () => {
    const { front, form, write, validation, duplicateValidation } = await startRepeatedSubmission();
    fireEvent.submit(form);
    await actAsync(async () => validation.resolve());
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    fireEvent.submit(form);
    await actAsync(async () => write.reject(new Error("write failed")));
    mocks.beforeCardWrite = undefined;
    await actAsync(async () => duplicateValidation.resolve());

    expect(await screen.findByText("Unable to save changes. Try again.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(front).toHaveValue("Front text");
    expect(editCard).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Updated card “Front text”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it("unlocks after invalid repeated submissions so corrected values can be saved", async () => {
    const { front, validation, duplicateValidation } = await startRepeatedSubmission(true);
    await actAsync(async () => validation.resolve());
    await actAsync(async () => duplicateValidation.resolve());
    expect(await screen.findByText("Front text is required.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled();
    expect(editCard).not.toHaveBeenCalled();
    await userEvent.type(front, "Corrected front");
    mocks.beforeCardWrite = undefined;
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Updated card “Corrected front”.")).toBeVisible();
    expect(await screen.findByRole("heading", { name: "Card list" })).toBeVisible();
  });

  it.each(["success", "failure"] as const)(
    "shows the shared %s toast without navigating when persistence finishes after leaving",
    async (outcome) => {
      const write = Promise.withResolvers<void>();
      mocks.beforeCardWrite = () => write.promise;
      const view = renderPage();
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      await actAsync(async () => view.router.navigate("/previous"));
      await userEvent.click(screen.getByRole("button", { name: "Discard changes" }));
      expect(await screen.findByRole("heading", { name: "Previous page" })).toBeVisible();

      await actAsync(async () => (outcome === "failure" ? write.reject(new Error("write failed")) : write.resolve()));

      expect(
        await screen.findByText(
          outcome === "success" ? "Updated card “Front text”." : "Unable to save changes. Try again."
        )
      ).toBeVisible();
      expect(screen.getByRole("heading", { name: "Previous page" })).toBeVisible();
    }
  );

  it("initializes a different Card and ignores navigation from the previous Card's save", async () => {
    await mutateCards("", [
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
    expect(await screen.findByText("Updated card “Front text”.")).toBeVisible();
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
          <CardFormPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid card id");
  });
});
