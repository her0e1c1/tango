/**
 * @file Verifies the Deck List Feature's card behavior.
 * The examples make the expected behavior concrete with cases such as "renders compact progress
 * for an active deck", "renders the card count and Study action for an inactive deck", "passes the
 * deck id to navigation and management actions".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DeckListCard } from "./DeckListCard";
import { ControlledDeckListCard } from "./ControlledDeckListCard";
import { createDeck } from "@/test/factories";

/**
 * Renders the test-only Controlled Deck Card component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const deck = createDeck({
  id: "deck-id",
  name: "Deck name",
  category: "math",
  isPublic: true,
});

describe("DeckListCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T00:10:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders compact progress for an active deck", () => {
    render(
      <DeckListCard
        deck={deck}
        cardCount={8}
        studyProgress={{
          currentIndex: 1,
          cardCount: 3,
          lastStudiedAt: new Date("2026-07-18T00:05:00Z").getTime(),
        }}
      />
    );

    expect(screen.getByText(deck.name)).toHaveClass("truncate");
    expect(screen.getByText("math")).toBeInTheDocument();
    expect(screen.getByLabelText("Public deck")).toBeInTheDocument();
    const viewButton = screen.getByRole("button", { name: "View Deck name" });
    const progressbar = screen.getByRole("progressbar", { name: "Progress for Deck name" });
    expect(viewButton).toHaveAccessibleDescription("math2 / 3 · 5m ago");
    expect(viewButton).not.toContainElement(progressbar);
    expect(progressbar).toHaveAttribute("aria-valuenow", "2");
    expect(screen.getByRole("button", { name: "Continue Deck name" })).toBeInTheDocument();
  });

  it("renders the card count and Study action for an inactive deck", () => {
    render(<ControlledDeckListCard deck={deck} cardCount={8} />);

    expect(screen.getByText("8 cards")).toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Study Deck name" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Deck name" }));
    expect(screen.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
  });

  it("passes the deck id to navigation and management actions", () => {
    const actions = {
      onClickName: vi.fn(),
      onClickContinue: vi.fn(),
      onClickStudy: vi.fn(),
      onClickRestart: vi.fn(),
      onClickDownload: vi.fn(),
      onClickEdit: vi.fn(),
      onClickDelete: vi.fn(),
    };
    render(
      <ControlledDeckListCard
        deck={deck}
        cardCount={8}
        studyProgress={{ currentIndex: 0, cardCount: 3, lastStudiedAt: Date.now() }}
        {...actions}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "View Deck name" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue Deck name" }));
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Restart" }));
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(actions.onClickName).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickContinue).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickStudy).not.toHaveBeenCalled();
    expect(actions.onClickRestart).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickDownload).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickEdit).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickDelete).toHaveBeenCalledExactlyOnceWith(deck.id);
  });

  it("routes inactive Study without opening the row", () => {
    const onClickName = vi.fn();
    const onClickStudy = vi.fn();
    render(<DeckListCard deck={deck} cardCount={1} onClickName={onClickName} onClickStudy={onClickStudy} />);

    fireEvent.click(screen.getByRole("button", { name: "Study Deck name" }));

    expect(onClickStudy).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(onClickName).not.toHaveBeenCalled();
  });

  it("makes only the pending Deck row unavailable", () => {
    const otherDeck = createDeck({ id: "other-deck", name: "Other deck" });
    render(
      <>
        <ControlledDeckListCard deck={deck} cardCount={8} isPending={(id) => id === deck.id} />
        <ControlledDeckListCard deck={otherDeck} cardCount={2} isPending={(id) => id === deck.id} />
      </>
    );

    expect(screen.getByRole("button", { name: "View Deck name" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Study Deck name" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for Deck name" })).toBeDisabled();
    expect(screen.getAllByRole("article")[0]).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("button", { name: "View Other deck" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Study Other deck" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for Other deck" })).not.toBeDisabled();
  });
});
