import "@/test/mockFirestorePersistence";
import type { Preferences } from "@/entities/preference";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { mutateCards } from "@/entities/card";
import { createDeck } from "@/entities/deck";
import { createLocalCard, createLocalDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  preferences: null as unknown as Preferences,
  setDarkMode: vi.fn(),
}));

vi.mock("@/entities/preference", () => ({
  usePreferences: () => mocks.preferences,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { CardViewPage } from "./CardViewPage";

describe("CARD-VIEW-04 CARD-VIEW-05 CardViewPage", () => {
  const deckId = "card-view-deck";
  const cardId = "card-id";
  const renderPage = (path = `/card/${cardId}`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list destination</h1>} />
          <Route path="/card/:id" element={<CardViewPage />} />
          <Route path="/card/:id/edit" element={<h1>Edit destination</h1>} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    mocks.preferences = createPreferences({ appearance: { darkMode: false } });
    mocks.setDarkMode.mockReset();
    await createDeck("user-id", createLocalDeck({ id: deckId, category: "raw" }));
    await mutateCards("user-id", [
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

  it("opens the current card editor from the icon link", async () => {
    renderPage();

    const link = screen.getByRole("link", { name: "Edit card" });
    expect(link).toHaveAttribute("href", `/card/${cardId}/edit`);
    expect(link).toHaveTextContent("");
    link.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("heading", { name: "Edit destination" })).toBeVisible();
  });

  it("updates the answer when the route selects another card without remounting", async () => {
    await mutateCards("user-id", [
      {
        kind: "create",
        card: createLocalCard({ id: "second-card", deckId, backText: "Second answer" }),
      },
    ]);
    render(
      <MemoryRouter initialEntries={[`/card/${cardId}`]}>
        <Link to="/card/second-card">View second card</Link>
        <Routes>
          <Route path="/card/:id" element={<CardViewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("Back text");

    await userEvent.click(screen.getByRole("link", { name: "View second card" }));

    expect(screen.getByRole("region", { name: "Card answer" })).toHaveTextContent("Second answer");
    expect(screen.getByRole("link", { name: "Edit card" })).toHaveAttribute("href", "/card/second-card/edit");
    expect(screen.getByRole("region", { name: "Card answer" })).not.toHaveTextContent("Back text");
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
