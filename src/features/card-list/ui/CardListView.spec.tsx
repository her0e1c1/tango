/**
 * @file Verifies the "CardListView" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the heading, zero
 * count and collapsed no-filter summary", "formats score bounds, tag count, persistent
 * chips, and singular card count", "constrains a long unbroken selected tag without changing its
 * text".
 */

import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { createCard } from "@/test/factories";

vi.mock("@/shared/api/firebase", () => ({ auth: {} }));

import { CardListView } from "./CardListView";

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", score: 0, tags: [] });
const otherCard = createCard({ id: "other-id", frontText: "Other", backText: "Other back", tags: ["two"] });

describe("CardListView", () => {
  it("renders the heading, zero count, and collapsed no-filter summary", () => {
    render(<CardListView cards={[]} filterSlot={<div>Controls</div>} />);

    expect(screen.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(screen.getByText("No filters")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeVisible();
    expect(screen.queryByText(/no cards/i)).not.toBeInTheDocument();
  });

  it("formats score bounds, tag count, persistent chips, and singular card count", () => {
    const view = render(
      <CardListView
        cards={[card]}
        filter={{ scoreMin: -1, scoreMax: 3, selectedTags: ["one", "two"] }}
        filterSlot={<div>Controls</div>}
      />
    );

    expect(screen.getByText("1 card")).toBeInTheDocument();
    expect(screen.getByText("score -1–3 · 2 tags")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Selected tags" })).toHaveTextContent("one");
    expect(screen.getByRole("list", { name: "Selected tags" })).toHaveTextContent("two");
    expect(screen.getByText("Controls")).not.toBeVisible();

    view.rerender(<CardListView cards={[card]} filter={{ scoreMin: -1, scoreMax: null, selectedTags: [] }} />);
    expect(screen.getByText("score ≥ -1")).toBeInTheDocument();

    view.rerender(<CardListView cards={[card]} filter={{ scoreMin: null, scoreMax: 3, selectedTags: [] }} />);
    expect(screen.getByText("score ≤ 3")).toBeInTheDocument();
  });

  it("constrains a long unbroken selected tag without changing its text", () => {
    const longTag = `tag-${"unbroken".repeat(30)}`;
    render(<CardListView cards={[card]} filter={{ scoreMin: null, scoreMax: null, selectedTags: [longTag] }} />);
    const chip = screen.getByText(longTag);

    expect(chip).toHaveTextContent(longTag);
    expect(chip).toHaveClass("max-w-full", "truncate");
  });

  it("removes one selected tag from the persistent filter summary", async () => {
    const onRemoveTag = vi.fn();
    render(
      <CardListView
        cards={[card]}
        filter={{ scoreMin: null, scoreMax: null, selectedTags: ["one", "two"] }}
        onRemoveTag={onRemoveTag}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Remove one filter" }));
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");
  });

  it("shows filter disclosure state", () => {
    render(<CardListView cards={[card]} />);
    expect(screen.getByText("Filters")).toBeVisible();
  });

  it("keeps only one menu open and removes it with a missing row", async () => {
    const view = render(<CardListView cards={[card, otherCard]} />);
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    expect(screen.getByRole("menu", { name: "Actions for Front" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Other" }));
    expect(screen.queryByRole("menu", { name: "Actions for Front" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Actions for Other" })).toBeInTheDocument();

    view.rerender(<CardListView cards={[card]} />);
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("preserves card display and overlay close callbacks", () => {
    const onShowCard = vi.fn();
    const onClose = vi.fn();
    render(
      <CardListView cards={[card]} onShowCard={onShowCard} overlay={{ content: <div>Overlay back</div>, onClose }} />
    );

    fireEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(onShowCard).toHaveBeenCalledExactlyOnceWith(card);
    fireEvent.click(screen.getByRole("button", { name: "Close card" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByText("Overlay back")).toBeInTheDocument();
  });
});
