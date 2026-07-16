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
    fireEvent.click(view.getByText("A long front"));
    fireEvent.click(view.getByRole("button", { name: "Edit card" }));
    fireEvent.click(view.getByRole("button", { name: "Delete card" }));
    expect(goToView).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    expect(onDelete).toHaveBeenCalledExactlyOnceWith(card.id);
  });

  it("suppresses actions while disabled and leaves onEdit unwired", () => {
    const actions = { goToView: vi.fn(), goToEdit: vi.fn(), onDelete: vi.fn(), onEdit: vi.fn() };
    const view = render(<Card card={card} disabled {...actions} />);
    fireEvent.click(view.getByText("A long front"));
    fireEvent.click(view.getByRole("button", { name: "Edit card" }));
    fireEvent.click(view.getByRole("button", { name: "Delete card" }));
    expect(Object.values(actions).every((action) => action.mock.calls.length === 0)).toBe(true);
  });
});
