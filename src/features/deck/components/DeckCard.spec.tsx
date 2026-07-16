import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DeckCard } from "@/features/deck/components/DeckCard";
import { DeckListTemplate } from "@/features/deck/components/templates/DeckListTemplate";

const deck = {
  id: "deck-id",
  name: "Deck name",
  category: "math",
  isPublic: false,
  url: "",
} as Deck;

describe("DeckCard", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the active study progress and enables restart", () => {
    const view = render(<DeckCard deck={deck} studyProgress={{ currentIndex: 1, cardCount: 3 }} />);

    expect(view.getByText("studying 2 card(s) from 3")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Restart" })).toBeEnabled();
  });

  it("hides study progress and disables restart without an active session", () => {
    const view = render(<DeckCard deck={deck} />);

    expect(view.queryByText(/studying/)).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Study" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Restart" })).toBeDisabled();
  });

  it("routes active Continue and Restart actions without cross-wiring callbacks", () => {
    const actions = {
      onClickName: vi.fn(),
      onClickStudy: vi.fn(),
      onClickRestart: vi.fn(),
      onClickDownload: vi.fn(),
      onClickEdit: vi.fn(),
      onClickDelete: vi.fn(),
      onClickReimport: vi.fn(),
    };
    const view = render(
      <DeckCard
        deck={{ ...deck, url: "https://example.com/deck" }}
        studyProgress={{ currentIndex: 0, cardCount: 2 }}
        {...actions}
      />
    );

    fireEvent.click(view.getByText(deck.name));
    expect(actions.onClickName).toHaveBeenCalledExactlyOnceWith(deck.id);

    fireEvent.click(view.getByRole("button", { name: "Continue" }));
    expect(actions.onClickRestart).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickStudy).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: "Restart" }));
    expect(actions.onClickStudy).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(actions.onClickRestart).toHaveBeenCalledTimes(1);

    fireEvent.click(view.getByRole("button", { name: "Download" }));
    expect(actions.onClickDownload).toHaveBeenCalledExactlyOnceWith(deck.id);

    fireEvent.click(view.getByRole("button", { name: "Edit" }));
    expect(actions.onClickEdit).toHaveBeenCalledExactlyOnceWith(deck.id);

    fireEvent.click(view.getByRole("button", { name: "Delete" }));
    expect(actions.onClickDelete).toHaveBeenCalledExactlyOnceWith(deck.id);

    fireEvent.click(view.getByRole("button", { name: "Reimport" }));
    expect(actions.onClickReimport).toHaveBeenCalledExactlyOnceWith(deck.id);
  });

  it("routes inactive Study to onClickStudy and keeps Restart inert", () => {
    const onClickStudy = vi.fn();
    const onClickRestart = vi.fn();
    const view = render(<DeckCard deck={deck} onClickStudy={onClickStudy} onClickRestart={onClickRestart} />);

    fireEvent.click(view.getByRole("button", { name: "Study" }));
    expect(onClickStudy).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(onClickRestart).not.toHaveBeenCalled();

    fireEvent.click(view.getByRole("button", { name: "Restart" }));
    expect(onClickRestart).not.toHaveBeenCalled();
    expect(onClickStudy).toHaveBeenCalledTimes(1);
  });

  it("keeps the delete glyph visibly destructive", () => {
    const view = render(<DeckCard deck={deck} />);
    const deleteButton = view.getByRole("button", { name: "Delete" });
    const deleteGlyph = deleteButton.querySelector("svg");

    expect(deleteButton).toHaveClass("text-danger");
    expect(deleteGlyph).not.toHaveClass("text-ink-muted");
  });

  it("enables restart only for the deck that owns the active progress", () => {
    const otherDeck = { ...deck, id: "other-deck", name: "Other deck" };
    const view = render(
      <DeckListTemplate decks={[deck, otherDeck]} studyProgress={{ deckId: deck.id, currentIndex: 1, cardCount: 3 }} />
    );

    const restartButtons = view.getAllByRole("button", { name: "Restart" });
    expect(restartButtons[0]).toBeEnabled();
    expect(restartButtons[1]).toBeDisabled();
    expect(view.getAllByText(/studying/)).toHaveLength(1);
  });
});
