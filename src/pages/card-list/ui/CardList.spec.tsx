/**
 * @file Verifies the "CardList" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the heading, zero
 * count and collapsed no-filter summary", "formats difficulty bounds, tag count, persistent
 * chips, and singular card count", "preserves a long selected tag without changing its
 * text".
 */

import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { createCard } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardList } from "./CardList";

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", difficulty: 5, tags: [] });
const otherCard = createCard({ id: "other-id", frontText: "Other", backText: "Other back", tags: ["two"] });

describe("CardList [CARD-01] [CARD-10]", () => {
  it("renders the heading, zero count, and collapsed no-filter summary", () => {
    render(<CardList cards={[]} filterSlot={<div>Controls</div>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(screen.getByText("No filters")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeVisible();
    expect(screen.queryByText(/no cards/i)).not.toBeInTheDocument();
  });

  it("formats difficulty bounds, tag count, persistent chips, and singular card count", () => {
    const view = render(
      <CardList
        cards={[card]}
        filter={{ difficultyMin: 2, difficultyMax: 8, selectedTags: ["one", "two"] }}
        filterSlot={<div>Controls</div>}
      />
    );

    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("difficulty 2–8 · 2 tags")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Selected tags" })).toHaveTextContent("one");
    expect(screen.getByRole("list", { name: "Selected tags" })).toHaveTextContent("two");
    expect(screen.getByText("Controls")).not.toBeVisible();

    view.rerender(<CardList cards={[card]} filter={{ difficultyMin: 2, difficultyMax: null, selectedTags: [] }} />);
    expect(screen.getByText("difficulty ≥ 2")).toBeInTheDocument();

    view.rerender(<CardList cards={[card]} filter={{ difficultyMin: null, difficultyMax: 8, selectedTags: [] }} />);
    expect(screen.getByText("difficulty ≤ 8")).toBeInTheDocument();
  });

  it("preserves a long selected tag without changing its text", () => {
    const longTag = `tag-${"unbroken".repeat(30)}`;
    render(<CardList cards={[card]} filter={{ difficultyMin: null, difficultyMax: null, selectedTags: [longTag] }} />);
    const chip = screen.getByText(longTag);

    expect(chip).toHaveTextContent(longTag);
  });

  it("removes one selected tag from the persistent filter summary", async () => {
    const onRemoveTag = vi.fn();
    render(
      <CardList
        cards={[card]}
        filter={{ difficultyMin: null, difficultyMax: null, selectedTags: ["one", "two"] }}
        onRemoveTag={onRemoveTag}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove one filter" }));
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");
  });

  it("shows filter disclosure state", () => {
    render(<CardList cards={[card]} />);
    expect(screen.getByText("Filters")).toBeVisible();
  });

  it("keeps only one menu open and removes it with a missing row", async () => {
    const view = render(<CardList cards={[card, otherCard]} />);
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    expect(screen.getByRole("menu", { name: "Actions for Front" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Other" }));
    expect(screen.queryByRole("menu", { name: "Actions for Front" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Actions for Other" })).toBeInTheDocument();

    view.rerender(<CardList cards={[card]} />);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("preserves card display and overlay close callbacks", () => {
    const onShowCard = vi.fn();
    const onClose = vi.fn();
    render(<CardList cards={[card]} onShowCard={onShowCard} overlay={{ content: <div>Overlay back</div>, onClose }} />);

    fireEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(onShowCard).toHaveBeenCalledExactlyOnceWith(card.id);
    fireEvent.click(screen.getByRole("button", { name: "Close card" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByText("Overlay back")).toBeInTheDocument();
  });
});
