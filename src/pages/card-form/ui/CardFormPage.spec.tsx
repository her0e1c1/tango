import type { Preferences } from "@/entities/preferences";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

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

import { CardFormPage } from "./CardFormPage";

describe("CardFormPage", () => {
  const deckId = "card-form-deck";
  const cardId = "card-id";
  const renderPage = (path = `/card/${cardId}/edit`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list</h1>} />
          <Route path="/card/:id/edit" element={<CardFormPage />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
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

  it("returns to the previous page after saving", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("returns to the previous page after cancellation", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
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
