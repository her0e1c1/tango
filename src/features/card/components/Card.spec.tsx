import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Card } from "@/features/card/components/Card";

const card = {
  id: "card-id",
  frontText: "A long front",
  backText: "Back",
  score: 3,
  numberOfSeen: 7,
  tags: ["one", "two"],
} as Card;

describe("Card", () => {
  afterEach(cleanup);

  it("preserves card metadata and routes view, edit, and delete with the card id", () => {
    const goToView = vi.fn();
    const goToEdit = vi.fn();
    const onDelete = vi.fn();
    const view = render(<Card card={card} goToView={goToView} goToEdit={goToEdit} onDelete={onDelete} />);

    expect(view.getByLabelText("Score 3, positive")).toBeInTheDocument();
    expect(view.getByText("studied 7 time(s)")).toBeInTheDocument();
    expect(view.getByText("one")).toBeInTheDocument();
    const actionGlyphs = view.container.querySelectorAll("svg");
    expect(view.container.querySelectorAll("button")).toHaveLength(0);
    expect(actionGlyphs).toHaveLength(2);
    expect(actionGlyphs[1]).toHaveClass("text-danger");
    fireEvent.click(view.getByText("A long front"));
    fireEvent.click(actionGlyphs[0] as Element);
    fireEvent.click(actionGlyphs[1] as Element);
    expect(goToView).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(card.id);
  });

  it("suppresses actions while disabled and leaves onEdit unwired", () => {
    const actions = { goToView: vi.fn(), goToEdit: vi.fn(), onDelete: vi.fn(), onEdit: vi.fn() };
    const view = render(<Card card={card} disabled {...actions} />);
    const actionGlyphs = view.container.querySelectorAll("svg");
    fireEvent.click(view.getByText("A long front"));
    fireEvent.click(actionGlyphs[0] as Element);
    fireEvent.click(actionGlyphs[1] as Element);
    expect(Object.values(actions).every((action) => action.mock.calls.length === 0)).toBe(true);
  });
});
