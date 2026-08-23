/**
 * @file Verifies the Deck List presentation contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the page count,
 * both compact sections", "omits empty sections", "opens one deck actions menu at a time".
 */

import type { DeckListState } from "../model/useDeckListState";

import { fireEvent, render, within, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";

import { DeckList } from "./DeckList";

const activeDeck = createDeck({ id: "active", name: "Active deck", category: "math" });
const otherDeck = createDeck({ id: "other", name: "Other deck", category: "history" });

const sections = {
  studying: [
    {
      deck: activeDeck,
      cardCount: 10,
      studySession: {
        sessionId: "active-session",
        deckId: activeDeck.id,
        cardOrderIds: ["card-1", "card-2", "card-3", "card-4"],
        currentIndex: 1,
        lastStudiedAt: Date.now(),
      },
    },
  ],
  other: [{ deck: otherDeck, cardCount: 7 }],
} satisfies DeckListState["sections"];

describe("DeckList", () => {
  it("renders the page count and both compact sections", () => {
    render(<DeckList sections={sections} />);

    expect(screen.getByRole("heading", { level: 1, name: "Decks" })).toBeInTheDocument();
    expect(screen.getByText("2 decks")).toBeInTheDocument();

    const studying = screen.getByRole("region", { name: "Studying" });
    expect(within(studying).getByText("1 deck · recent first")).toBeInTheDocument();
    expect(within(studying).getByText(activeDeck.name)).toBeInTheDocument();

    const other = screen.getByRole("region", { name: "Other decks" });
    expect(within(other).getByText("1 deck · A–Z")).toBeInTheDocument();
    expect(within(other).getByText(otherDeck.name)).toBeInTheDocument();
  });

  it("omits empty sections", () => {
    render(<DeckList sections={{ studying: [], other: sections.other }} />);

    expect(screen.queryByRole("region", { name: "Studying" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Other decks" })).toBeInTheDocument();
  });

  it("opens one deck actions menu at a time", () => {
    render(<DeckList sections={sections} />);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Active deck" }));
    expect(screen.getByRole("menu", { name: "Actions for Active deck" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Other deck" }));
    expect(screen.queryByRole("menu", { name: "Actions for Active deck" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Actions for Other deck" })).toBeInTheDocument();
  });

  it("does not introduce an empty-state message", () => {
    render(<DeckList sections={{ studying: [], other: [] }} />);

    expect(screen.getByText("0 decks")).toBeInTheDocument();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.queryByText(/no decks/i)).not.toBeInTheDocument();
  });
});
