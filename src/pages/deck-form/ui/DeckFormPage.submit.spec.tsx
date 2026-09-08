import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    const router = createMemoryRouter(
      [
        { path: "/", element: <h1>Deck list</h1> },
        { path: "/deck/:id/edit", element: <DeckFormPage /> },
      ],
      { initialEntries: [`/deck/${deckId}/edit`] }
    );
    render(
      <>
        <RouterProvider router={router} />
        <ToastViewport />
      </>
    );
    const submitButton = screen.getByRole("button", { name: "Save changes" });
    const form = submitButton.closest("form");
    if (form === null) throw new Error("Deck form was not found");

    fireEvent.submit(form);
    fireEvent.submit(form);

    await waitFor(() => expect(mocks.editCalls).toBe(1));
    await actAsync(async () => finishSave());
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });
});
