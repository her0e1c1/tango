/**
 * @file Verifies the "CardListTemplate" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders the heading, zero
 * count, collapsed no-filter summary, and feedback", "formats score bounds, tag count, persistent
 * chips, and singular card count", "constrains a long unbroken selected tag without changing its
 * text".
 */

import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CardListTemplate } from "@/features/card/components/templates/CardListTemplate";
import { createCard } from "@/test/factories";

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", score: 0, tags: [] });
const otherCard = createCard({ id: "other-id", frontText: "Other", backText: "Other back", tags: ["two"] });

describe("CardListTemplate", () => {
  afterEach(cleanup);

  it("renders the heading, zero count, collapsed no-filter summary, and feedback", () => {
    const view = render(
      <CardListTemplate cards={[]} feedbackSlot={<div role="status">Saved</div>} filterSlot={<div>Controls</div>} />
    );

    expect(view.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(view.getByText("0 cards")).toBeInTheDocument();
    expect(view.getByText("No filters")).toBeInTheDocument();
    expect(view.getByText("Filters").closest("details")).not.toHaveAttribute("open");
    expect(view.getByRole("status")).toHaveTextContent("Saved");
    expect(view.queryByText(/no cards/i)).not.toBeInTheDocument();
  });

  it("formats score bounds, tag count, persistent chips, and singular card count", () => {
    const view = render(
      <CardListTemplate
        cards={[card]}
        filter={{ scoreMin: -1, scoreMax: 3, selectedTags: ["one", "two"] }}
        filterSlot={<div>Controls</div>}
      />
    );

    expect(view.getByText("1 card")).toBeInTheDocument();
    expect(view.getByText("score -1–3 · 2 tags")).toBeInTheDocument();
    expect(view.getByRole("list", { name: "Selected tags" })).toHaveTextContent("one");
    expect(view.getByRole("list", { name: "Selected tags" })).toHaveTextContent("two");
    expect(view.getByText("Controls")).not.toBeVisible();

    view.rerender(<CardListTemplate cards={[card]} filter={{ scoreMin: -1, scoreMax: null, selectedTags: [] }} />);
    expect(view.getByText("score ≥ -1")).toBeInTheDocument();

    view.rerender(<CardListTemplate cards={[card]} filter={{ scoreMin: null, scoreMax: 3, selectedTags: [] }} />);
    expect(view.getByText("score ≤ 3")).toBeInTheDocument();
  });

  it("constrains a long unbroken selected tag without changing its text", () => {
    const longTag = `tag-${"unbroken".repeat(30)}`;
    const view = render(
      <CardListTemplate cards={[card]} filter={{ scoreMin: null, scoreMax: null, selectedTags: [longTag] }} />
    );
    const chip = view.getByText(longTag);

    expect(chip).toHaveTextContent(longTag);
    expect(chip).toHaveClass("max-w-full", "truncate");
  });

  it("removes one selected tag from the persistent filter summary", async () => {
    const onRemoveTag = vi.fn();
    const view = render(
      <CardListTemplate
        cards={[card]}
        filter={{ scoreMin: null, scoreMax: null, selectedTags: ["one", "two"] }}
        onRemoveTag={onRemoveTag}
      />
    );

    await userEvent.click(view.getByRole("button", { name: "Remove one filter" }));
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");
  });

  it("shows a token-styled decorative chevron for filter disclosure state", () => {
    const view = render(<CardListTemplate cards={[card]} />);
    const details = view.getByText("Filters").closest("details");
    const chevron = details?.querySelector('[aria-hidden="true"]');

    expect(details).toHaveClass("group");
    expect(chevron).toHaveClass("text-ink-muted", "group-open:rotate-180");
  });

  it("keeps only one menu open and removes it with a missing row", async () => {
    const view = render(<CardListTemplate cards={[card, otherCard]} />);
    fireEvent.click(view.getByRole("button", { name: "Open actions for Front" }));
    expect(view.getByRole("menu", { name: "Actions for Front" })).toBeInTheDocument();

    fireEvent.click(view.getByRole("button", { name: "Open actions for Other" }));
    expect(view.queryByRole("menu", { name: "Actions for Front" })).not.toBeInTheDocument();
    expect(view.getByRole("menu", { name: "Actions for Other" })).toBeInTheDocument();

    view.rerender(<CardListTemplate cards={[card]} />);
    await waitFor(() => expect(view.queryByRole("menu")).not.toBeInTheDocument());
  });

  it("preserves card display and overlay close callbacks", () => {
    const onShowCard = vi.fn();
    const onClose = vi.fn();
    const view = render(
      <CardListTemplate
        cards={[card]}
        onShowCard={onShowCard}
        overlay={{ backText: { text: "Overlay back" }, onClose }}
      />
    );

    fireEvent.click(view.getByRole("button", { name: "View Front" }));
    expect(onShowCard).toHaveBeenCalledExactlyOnceWith(card);
    fireEvent.click(view.getByRole("button", { name: "Close card" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(view.getByText("Overlay back")).toBeInTheDocument();
  });
});
