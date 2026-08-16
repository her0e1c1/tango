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

vi.mock("@/entities/preferences", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardViewPage } from "./CardViewPage";

describe("CardViewPage", () => {
  const deckId = "card-view-deck";
  const cardId = "card-id";
  const renderPage = (path = `/card/${cardId}`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list destination</h1>} />
          <Route path="/card/:id" element={<CardViewPage />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("", createLocalDeck({ id: deckId, category: "raw" }));
    await mutateCards("", [
      {
        kind: "create",
        card: createLocalCard({ id: cardId, deckId, frontText: "Front text", backText: "Back text" }),
      },
    ]);
  });

  it("renders the stored card answer in the application shell", () => {
    renderPage();

    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("Back text");
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("navigates with both recovery actions when the card is unavailable", async () => {
    const view = renderPage("/card/missing-card");

    expect(screen.getByRole("heading", { level: 1, name: "Card not found" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    view.unmount();
    renderPage("/card/missing-card");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a card id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <CardViewPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid card id");
  });
});
