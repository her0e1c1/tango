import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  beforeDeckWrite: undefined as (() => Promise<void>) | undefined,
  editCalls: 0,
  preferences: null as unknown as Preferences,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id" }));
vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: vi.fn(),
}));
vi.mock("@/entities/deck", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/entities/deck")>();
  return {
    ...actual,
    editDeck: async () => {
      mocks.editCalls += 1;
      await mocks.beforeDeckWrite?.();
    },
  };
});
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckFormPage } from "./DeckFormPage";

const createDeckFormRouter = (deckId: string) =>
  createMemoryRouter(
    [
      { path: "/", element: <h1>Deck list</h1> },
      { path: "/deck/:id/edit", element: <DeckFormPage /> },
    ],
    { initialEntries: [`/deck/${deckId}/edit`] }
  );

describe("DeckFormPage submit entrance [DECK-02]", () => {
  const deckId = "deck-form-submit-deck";

  beforeEach(async () => {
    dismissToast();
    mocks.beforeDeckWrite = undefined;
    mocks.editCalls = 0;
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    await createDeck("", createLocalDeck({ id: deckId, name: "Deck name" }));
  });

  it("starts one save for same-tick submits while asynchronous validation is pending", async () => {
    let finishSave: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    const router = createDeckFormRouter(deckId);
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const submitButton = screen.getByRole("button", { name: "Save changes" });

    fireEvent.submit(submitButton);
    fireEvent.submit(submitButton);

    await waitFor(() => expect(mocks.editCalls).toBe(1));
    await actAsync(async () => finishSave());
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("publishes success after Page unmount without navigating the old visit", async () => {
    let finishSave: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    const router = createDeckFormRouter(deckId);
    const { unmount } = render(<RouterProvider router={router} />);
    render(<ToastViewport />);

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    const openingPath = router.state.location.pathname;
    unmount();
    await actAsync(async () => finishSave());

    expect(router.state.location.pathname).toBe(openingPath);
    expect(await screen.findByText("Updated deck “Deck name”.")).toBeVisible();
  });
});
