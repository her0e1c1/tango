import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
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

import { CardListPage } from "./CardListPage";

const NextDeckButton = () => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => void navigate("/deck/next-deck")}>
      Open next deck
    </button>
  );
};

describe("CardListPage", () => {
  const deckId = "deck-id";
  const nextDeckId = "next-deck";
  const cardId = "card-id";
  const nextCardId = "next-card";
  const renderPage = (path = `/deck/${deckId}`) =>
    render(
      <MemoryRouter initialEntries={["/previous", path]} initialIndex={1}>
        <NextDeckButton />
        <Routes>
          <Route path="/previous" element={<h1>Previous page</h1>} />
          <Route path="/" element={<h1>Deck list destination</h1>} />
          <Route path="/settings" element={<h1>Settings destination</h1>} />
          <Route path="/card/:id/edit" element={<h1>Card editor destination</h1>} />
          <Route path="/deck/:id" element={<CardListPage />} />
        </Routes>
      </MemoryRouter>
    );

  beforeEach(async () => {
    mocks.preferences = createPreferences();
    mocks.setDarkMode.mockReset();
    await createDeck("", createLocalDeck({ id: deckId, name: "First deck", selectedTags: ["typescript"] }));
    await createDeck("", createLocalDeck({ id: nextDeckId, name: "Next deck" }));
    await mutateCards("", [
      {
        kind: "create",
        card: createLocalCard({
          id: cardId,
          deckId,
          frontText: "Front one",
          backText: "Back one",
          tags: ["typescript"],
          uniqueKey: "card-one",
        }),
      },
      {
        kind: "create",
        card: createLocalCard({
          id: nextCardId,
          deckId: nextDeckId,
          frontText: "Front two",
          backText: "Back two",
          uniqueKey: "card-two",
        }),
      },
    ]);
  });

  it("renders stored cards and navigates to the selected card editor", async () => {
    renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "Cards" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View Front one" })).toBeVisible();
    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front one" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Card editor destination" })).toBeVisible();
  });

  it("removes a selected tag from the visible filter", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "Remove typescript filter" }));

    await waitFor(() =>
      expect(screen.queryByRole("button", { name: "Remove typescript filter" })).not.toBeInTheDocument()
    );
    expect(screen.getByText("No filters")).toBeVisible();
  });

  it("navigates from both route shortcuts", async () => {
    const view = renderPage();
    fireEvent.keyDown(window, { key: "t" });
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    view.unmount();
    renderPage();
    fireEvent.keyDown(window, { key: "s" });
    expect(await screen.findByRole("heading", { level: 1, name: "Settings destination" })).toBeVisible();
  });

  it("resets the shown card when navigation changes the route deck", async () => {
    renderPage();

    await userEvent.click(screen.getByRole("button", { name: "View Front one" }));
    expect(screen.getByLabelText("Close card")).toHaveTextContent("Back one");

    await userEvent.click(screen.getByRole("button", { name: "Open next deck" }));

    expect(await screen.findByRole("button", { name: "View Front two" })).toBeVisible();
    expect(screen.queryByLabelText("Close card")).not.toBeInTheDocument();
  });

  it("navigates with both recovery actions when the deck is unavailable", async () => {
    const view = renderPage("/deck/missing-deck");

    expect(screen.getByRole("heading", { name: "Deck not found" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Go home" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Deck list destination" })).toBeVisible();

    view.unmount();
    renderPage("/deck/missing-deck");
    await userEvent.click(screen.getByRole("button", { name: "Go back" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Previous page" })).toBeVisible();
  });

  it("rejects a route without a deck id", () => {
    expect(() =>
      render(
        <MemoryRouter>
          <CardListPage />
        </MemoryRouter>
      )
    ).toThrowError("invalid deck id");
  });
});
