/**
 * @file Verifies the "DeckListTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the page count,
 * feedback, and both compact sections", "omits empty sections", "opens one deck actions menu at a
 * time".
 */

import * as React from "react";
import { cleanup, fireEvent, render, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { DeckListTemplate, type DeckListSections } from "@/features/deck/components/templates/DeckListTemplate";
import { createDeck } from "@/test/factories";

const activeDeck = createDeck({ id: "active", name: "Active deck", category: "math" });
const otherDeck = createDeck({ id: "other", name: "Other deck", category: "history" });

const sections: DeckListSections = {
  studying: [
    {
      deck: activeDeck,
      cardCount: 10,
      studyProgress: { currentIndex: 1, cardCount: 4, lastStudiedAt: Date.now() },
    },
  ],
  other: [{ deck: otherDeck, cardCount: 7 }],
};

/**
 * Renders the test-only Controlled Deck List component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ControlledDeckList = () => {
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  return (
    <DeckListTemplate
      sections={sections}
      deckCard={{
        openMenuDeckId,
        onToggleMenu: (id) => setOpenMenuDeckId((value) => (value === id ? undefined : id)),
        onCloseMenu: () => setOpenMenuDeckId(undefined),
      }}
    />
  );
};

describe("DeckListTemplate", () => {
  afterEach(cleanup);

  it("renders the page count, feedback, and both compact sections", () => {
    const view = render(<DeckListTemplate sections={sections} feedbackSlot={<div role="status">Saved</div>} />);

    expect(view.getByRole("heading", { level: 1, name: "Decks" })).toBeInTheDocument();
    expect(view.getByText("2 decks")).toBeInTheDocument();
    expect(view.getByRole("status")).toHaveTextContent("Saved");

    const studying = view.getByRole("region", { name: "Studying" });
    expect(within(studying).getByText("1 deck · recent first")).toBeInTheDocument();
    expect(within(studying).getByText(activeDeck.name)).toBeInTheDocument();

    const other = view.getByRole("region", { name: "Other decks" });
    expect(within(other).getByText("1 deck · A–Z")).toBeInTheDocument();
    expect(within(other).getByText(otherDeck.name)).toBeInTheDocument();
  });

  it("omits empty sections", () => {
    const view = render(<DeckListTemplate sections={{ studying: [], other: sections.other }} />);

    expect(view.queryByRole("region", { name: "Studying" })).not.toBeInTheDocument();
    expect(view.getByRole("region", { name: "Other decks" })).toBeInTheDocument();
  });

  it("opens one deck actions menu at a time", () => {
    const view = render(<ControlledDeckList />);

    fireEvent.click(view.getByRole("button", { name: "Open actions for Active deck" }));
    expect(view.getByRole("menu", { name: "Actions for Active deck" })).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Open actions for Other deck" }));
    expect(view.queryByRole("menu", { name: "Actions for Active deck" })).not.toBeInTheDocument();
    expect(view.getByRole("menu", { name: "Actions for Other deck" })).toBeInTheDocument();
  });

  it("does not introduce an empty-state message", () => {
    const view = render(<DeckListTemplate sections={{ studying: [], other: [] }} />);

    expect(view.getByText("0 decks")).toBeInTheDocument();
    expect(view.queryByRole("region")).not.toBeInTheDocument();
    expect(view.queryByText(/no decks/i)).not.toBeInTheDocument();
  });
});
