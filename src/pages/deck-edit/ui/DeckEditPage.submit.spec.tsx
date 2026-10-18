import "@/test/mockFirestorePersistence";
import * as React from "react";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { actAsync } from "@/test/act";
import { createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  beforeDeckWrite: undefined as (() => Promise<void>) | undefined,
  editCalls: 0,
  preferences: null as unknown as Preferences,
}));

vi.mock("@/entities/auth", () => ({ getAuthUid: () => "user-id", useAuth: () => ({ isAnonymous: false }) }));
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

import { DeckEditPage } from "./DeckEditPage";

const createDeckEditRouter = (deckId: string) =>
  createMemoryRouter(
    [
      { path: "/", element: <h1>Deck list</h1> },
      { path: "/deck/:id/edit", element: <DeckEditPage /> },
    ],
    { initialEntries: [`/deck/${deckId}/edit`] }
  );

describe("DeckEditPage submission [DECK-MANAGEMENT-01]", () => {
  const deckId = "deck-edit-submit-deck";

  beforeEach(async () => {
    // Given: Establish the shared setup used by the following cases.
    dismissToast();
    mocks.beforeDeckWrite = undefined;
    mocks.editCalls = 0;
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    await createDeck("user-id", createLocalDeck({ id: deckId, name: "Deck name" }));
  });

  it("starts one save for same-tick submits while asynchronous validation is pending", async () => {
    // Given: Prepare `finishSave`, `router`, `submitButton` and any shared test state below.
    let finishSave: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    const router = createDeckEditRouter(deckId);
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const submitButton = screen.getByRole("button", { name: "Save changes" });

    // When: Exercise `fireEvent.submit` with the prepared inputs.
    fireEvent.submit(submitButton);
    fireEvent.submit(submitButton);

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(mocks.editCalls).toBe(1));
    expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
    // When: Exercise `actAsync` with the prepared inputs.
    await actAsync(async () => finishSave());
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("saves a corrected draft after validation rejects the first submission", async () => {
    // Given: Prepare `router`, `name` and any shared test state below.
    const router = createDeckEditRouter(deckId);
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const name = screen.getByRole("textbox", { name: "Name" });
    // When: Exercise `userEvent.clear` with the prepared inputs.
    await userEvent.clear(name);
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByText("Deck name is required.")).toBeVisible();
    // When: Exercise `userEvent.type` with the prepared inputs.
    await userEvent.type(name, "Corrected deck");
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(screen.getByText("Updated deck “Corrected deck”.")).toBeVisible();
  });

  it.each(["deck-edit-submit-deck", "another-deck"])(
    "keeps the new editor submission pending when an earlier visit finishes (%s)",
    async (nextDeckId) => {
      // Given: Prepare `finishOldSave`, `oldRouter`, `view` and any shared test state below.
      await createDeck("user-id", createLocalDeck({ id: nextDeckId, name: "Deck name" }));
      let finishOldSave: () => void = () => undefined;
      mocks.beforeDeckWrite = () =>
        new Promise<void>((resolve) => {
          finishOldSave = resolve;
        });
      const oldRouter = createDeckEditRouter(deckId);
      const view = render(<RouterProvider router={oldRouter} />);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      // Then: Verify the expected result in the assertions below.
      expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
      // When: Exercise `view.unmount` with the prepared inputs.
      view.unmount();

      let finishNewSave: () => void = () => undefined;
      mocks.beforeDeckWrite = () =>
        new Promise<void>((resolve) => {
          finishNewSave = resolve;
        });
      const router = createDeckEditRouter(nextDeckId);
      render(
        <React.StrictMode>
          <RouterProvider router={router} />
        </React.StrictMode>
      );
      await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
      const saving = await screen.findByRole("button", { name: "Saving…" });
      // Then: Verify the expected result in the assertions below.
      expect(saving).toBeDisabled();

      // When: Exercise `actAsync` with the prepared inputs.
      await actAsync(async () => finishOldSave());
      // Then: Verify the expected result in the assertions below.
      expect(router.state.location.pathname).toBe(`/deck/${nextDeckId}/edit`);
      expect(saving).toBeDisabled();
      // When: Exercise `fireEvent.submit` with the prepared inputs.
      fireEvent.submit(saving);
      await actAsync(async () => undefined);
      // Then: Verify the expected result in the assertions below.
      expect(mocks.editCalls).toBe(2);

      // When: Exercise `actAsync` with the prepared inputs.
      await actAsync(async () => finishNewSave());
      // Then: Verify the expected result in the assertions below.
      expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    }
  );

  it("does not submit a replaced form when its asynchronous validation finishes", async () => {
    // Given: Prepare `oldRouter`, `view` and any shared test state below.
    const oldRouter = createDeckEditRouter(deckId);
    const view = render(<RouterProvider router={oldRouter} />);
    // When: Exercise `fireEvent.submit` with the prepared inputs.
    fireEvent.submit(screen.getByRole("button", { name: "Save changes" }));
    view.unmount();

    const router = createDeckEditRouter(deckId);
    render(<RouterProvider router={router} />);
    await actAsync(async () => undefined);

    // Then: Verify the expected result in the assertions below.
    expect(mocks.editCalls).toBe(0);
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
    expect(mocks.editCalls).toBe(1);
  });

  it("publishes success after Page unmount without navigating the old visit", async () => {
    // Given: Prepare `finishSave`, `router` and any shared test state below.
    let finishSave: () => void = () => undefined;
    mocks.beforeDeckWrite = () =>
      new Promise<void>((resolve) => {
        finishSave = resolve;
      });
    const router = createDeckEditRouter(deckId);
    const { unmount } = render(<RouterProvider router={router} />);
    render(<ToastViewport />);

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    // Then: Verify the expected result in the assertions below.
    expect(await screen.findByRole("button", { name: "Saving…" })).toBeDisabled();
    const openingPath = router.state.location.pathname;
    // When: Exercise `unmount` with the prepared inputs.
    unmount();
    await actAsync(async () => finishSave());

    // Then: Verify the expected result in the assertions below.
    expect(router.state.location.pathname).toBe(openingPath);
    expect(await screen.findByText("Updated deck “Deck name”.")).toBeVisible();
  });
});
