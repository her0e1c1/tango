import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as React from "react";

import { DeckCard, type DeckCardProps } from "@/features/deck/components/DeckCard";
import { createDeck } from "@/test/factories";

const ControlledDeckCard: React.FC<DeckCardProps> = (props) => {
  const [openMenuDeckId, setOpenMenuDeckId] = React.useState<DeckId>();
  return (
    <DeckCard
      {...props}
      openMenuDeckId={openMenuDeckId}
      onToggleMenu={(id) => setOpenMenuDeckId((value) => (value === id ? undefined : id))}
      onCloseMenu={() => setOpenMenuDeckId(undefined)}
    />
  );
};

const deck = createDeck({
  id: "deck-id",
  name: "Deck name",
  category: "math",
  isPublic: true,
});

describe("DeckCard", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-18T00:10:00Z"));
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("renders compact progress for an active deck", () => {
    const view = render(
      <DeckCard
        deck={deck}
        cardCount={8}
        studyProgress={{
          currentIndex: 1,
          cardCount: 3,
          lastStudiedAt: new Date("2026-07-18T00:05:00Z").getTime(),
        }}
      />
    );

    expect(view.getByText(deck.name)).toHaveClass("truncate");
    expect(view.getByText("math")).toBeInTheDocument();
    expect(view.getByLabelText("Public deck")).toBeInTheDocument();
    const status = view.getByText("2 / 3 · 5m ago").parentElement;
    const viewButton = view.getByRole("button", { name: "View Deck name" });
    const progressbar = view.getByRole("progressbar", { name: "Progress for Deck name" });
    expect(status).toHaveAttribute("id");
    expect(viewButton).toHaveAttribute("aria-describedby", status?.id);
    expect(viewButton).not.toContainElement(progressbar);
    expect(progressbar).toHaveAttribute("aria-valuenow", "2");
    expect(view.getByRole("button", { name: "Continue Deck name" })).toBeInTheDocument();
  });

  it("renders the card count and Study action for an inactive deck", () => {
    const view = render(<ControlledDeckCard deck={deck} cardCount={8} />);

    expect(view.getByText("8 cards")).toBeInTheDocument();
    expect(view.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(view.getByRole("button", { name: "Study Deck name" })).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Open actions for Deck name" }));
    expect(view.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
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
    const view = render(
      <ControlledDeckCard
        deck={deck}
        cardCount={8}
        studyProgress={{ currentIndex: 0, cardCount: 3, lastStudiedAt: Date.now() }}
        {...actions}
      />
    );

    fireEvent.click(view.getByRole("button", { name: "View Deck name" }));
    fireEvent.click(view.getByRole("button", { name: "Continue Deck name" }));
    fireEvent.click(view.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Restart" }));
    fireEvent.click(view.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Download" }));
    fireEvent.click(view.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Edit" }));
    fireEvent.click(view.getByRole("button", { name: "Open actions for Deck name" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));

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
    const view = render(<DeckCard deck={deck} cardCount={1} onClickName={onClickName} onClickStudy={onClickStudy} />);

    fireEvent.click(view.getByRole("button", { name: "Study Deck name" }));

    expect(onClickStudy).toHaveBeenCalledExactlyOnceWith(deck.id);
    expect(onClickName).not.toHaveBeenCalled();
  });

  it("makes only the pending Deck row unavailable", () => {
    const otherDeck = createDeck({ id: "other-deck", name: "Other deck" });
    const view = render(
      <>
        <ControlledDeckCard deck={deck} cardCount={8} isPending={(id) => id === deck.id} />
        <ControlledDeckCard deck={otherDeck} cardCount={2} isPending={(id) => id === deck.id} />
      </>
    );

    expect(view.getByRole("button", { name: "View Deck name" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Study Deck name" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Open actions for Deck name" })).toBeDisabled();
    expect(view.getByRole("button", { name: "View Deck name" }).closest("article")).toHaveAttribute(
      "aria-busy",
      "true"
    );
    expect(view.getByRole("button", { name: "View Other deck" })).not.toBeDisabled();
    expect(view.getByRole("button", { name: "Study Other deck" })).not.toBeDisabled();
    expect(view.getByRole("button", { name: "Open actions for Other deck" })).not.toBeDisabled();
  });
});
