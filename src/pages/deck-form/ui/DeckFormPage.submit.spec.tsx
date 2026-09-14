import * as React from "react";
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

  it("saves a corrected draft after validation rejects the first submission", async () => {
    const router = createDeckFormRouter(deckId);
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const name = screen.getByRole("textbox", { name: "Name" });
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    await userEvent.type(name, "Corrected deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Updated deck “Corrected deck”.")).toBeVisible();
  });

  it.each(["deck-form-submit-deck", "another-deck"])(
    "keeps the new editor submission pending when an earlier visit finishes (%s)",
    async (nextDeckId) => {
      await createDeck("", createLocalDeck({ id: nextDeckId, name: "Deck name" }));
      let finishOldSave: () => void = () => undefined;
      mocks.beforeDeckWrite = () =>
        new Promise<void>((resolve) => {
          finishOldSave = resolve;
        });
      const oldRouter = createDeckFormRouter(deckId);
      const view = render(<RouterProvider router={oldRouter} />);
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
      view.unmount();

      let finishNewSave: () => void = () => undefined;
      mocks.beforeDeckWrite = () =>
        new Promise<void>((resolve) => {
          finishNewSave = resolve;
        });
      const router = createDeckFormRouter(nextDeckId);
      render(
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>
      );
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      const saving = await screen.findByRole("button", { name: "Saving…" });
      expect(saving).toBeDisabled();

      await actAsync(async () => finishOldSave());
      expect(router.state.location.pathname).toBe(`/deck/${nextDeckId}/edit`);
      expect(saving).toBeDisabled();
      fireEvent.submit(saving);
      await actAsync(async () => undefined);
      expect(mocks.editCalls).toBe(2);

      await actAsync(async () => finishNewSave());
      expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    }
  );

  it("does not submit a replaced form when its asynchronous validation finishes", async () => {
    const oldRouter = createDeckFormRouter(deckId);
    const view = render(<RouterProvider router={oldRouter} />);
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }));
    view.unmount();

    const router = createDeckFormRouter(deckId);
    render(<RouterProvider router={router} />);
    await actAsync(async () => undefined);

    expect(mocks.editCalls).toBe(0);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(mocks.editCalls).toBe(1);
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
