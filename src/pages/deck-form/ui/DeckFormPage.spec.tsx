import type { Preferences } from "@/entities/preferences";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/auth", () => ({ useAuthUid: () => "user-id" }));
vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { DeckFormPage } from "./DeckFormPage";

describe("DeckFormPage", () => {
  const deckId = "deck-id";
  const renderPage = (path = `/deck/${deckId}/edit`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list</h1>} />
          <Route path="/deck/:id/edit" element={<DeckFormPage />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("", createLocalDeck({ id: deckId, name: "Deck name", category: "", convertToBr: false }));
  });

  it("renders the stored deck editor in the application shell", () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("Deck name");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("navigates to the deck list after saving", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
  });

  it("navigates to the deck list after cancellation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Deck list" })).toBeVisible();
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
