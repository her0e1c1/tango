/**
 * @file Verifies the "DeckStartForm with useDeckFilterState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits score and tag
 * filter changes", "auto-submits score toggle and slider changes", "auto-submits individual tag,
 * all, and clear changes".
 */

import type React from "react";

import userEvent from "@testing-library/user-event";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartForm } from "@/features/deck/components/DeckStartForm";
import { useDeckFilterState } from "@/features/deck/hooks/useDeckFilterState";
import { createDeck } from "@/test/factories";

/**
 * Renders the test-only Deck Filter Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const DeckFilterHarness: React.FC<{
  deck: Deck;
  tags: string[];
  onSubmit: (deck: Deck) => void;
}> = ({ deck, tags, onSubmit }) => {
  const deckStartForm = useDeckFilterState({ deck, tags, onSubmit });
  return <DeckStartForm {...deckStartForm} />;
};

describe("DeckStartForm with useDeckFilterState", () => {
  const deck = createDeck({
    scoreMax: 1,
    scoreMin: -1,
    tagAndFilter: false,
    selectedTags: [],
  });
  const tags = ["tag1", "tag2", "tag3"];

  it("auto-submits score and tag filter changes", async () => {
    const onSubmit = vi.fn();
    render(<DeckFilterHarness onSubmit={onSubmit} deck={deck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...deck,
        scoreMax: 2,
        scoreMin: -2,
        tagAndFilter: true,
        selectedTags: tags,
      });
    });
  });

  it("auto-submits score toggle and slider changes", async () => {
    const onSubmit = vi.fn();
    render(<DeckFilterHarness onSubmit={onSubmit} deck={{ ...deck, scoreMax: null, scoreMin: null }} tags={tags} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, scoreMax: 0, scoreMin: null });
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, scoreMax: 0, scoreMin: 0 });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, scoreMax: 2, scoreMin: -2 });
    });

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, scoreMax: null, scoreMin: null });
    });
  });

  it("auto-submits individual tag, all, and clear changes", async () => {
    const onSubmit = vi.fn();
    render(<DeckFilterHarness onSubmit={onSubmit} deck={deck} tags={tags} />);

    await userEvent.click(screen.getByText("tag2"));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, selectedTags: ["tag2"] });
    });

    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, selectedTags: tags });
    });

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...deck, selectedTags: [] });
    });
  });
});
