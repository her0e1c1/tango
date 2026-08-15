/**
 * @file Verifies the "DeckFilterForm with useDeckFilterState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits score and tag
 * filter changes", "auto-submits score toggle and slider changes", "auto-submits individual tag,
 * all, and clear changes".
 */

import type { Deck } from "@/entities/deck";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterState } from "./useDeckFilterState";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({ editDeck: vi.fn() }));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/entities/deck", () => ({ editDeck: mocks.editDeck }));

/**
 * Renders the test-only Deck Filter Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const DeckFilterHarness: React.FC<{
  deck: Deck;
  tags: string[];
}> = ({ deck, tags }) => {
  const deckFilter = useDeckFilterState(deck);
  return <DeckFilterForm {...deckFilter} tags={tags} />;
};

describe("DeckFilterForm with useDeckFilterState", () => {
  const deck = createDeck({
    scoreMax: 1,
    scoreMin: -1,
    tagAndFilter: false,
    selectedTags: [],
  });
  const tags = ["tag1", "tag2", "tag3"];

  beforeEach(() => {
    mocks.editDeck.mockReset().mockResolvedValue(undefined);
  });

  it("persists score and tag filter changes", async () => {
    render(<DeckFilterHarness deck={deck} tags={tags} />);

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));

    await waitFor(() => expect(mocks.editDeck).toHaveBeenCalledTimes(4));
    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deck.id, scoreMax: 2 });
    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deck.id, scoreMin: -2 });
    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deck.id, tagAndFilter: true });
    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", { id: deck.id, selectedTags: tags });
  });

  it("persists score toggle and slider changes", async () => {
    render(<DeckFilterHarness deck={{ ...deck, scoreMax: null, scoreMin: null }} tags={tags} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, scoreMax: 0 });
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, scoreMin: 0 });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, scoreMin: -2 });
    });

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, scoreMin: null });
    });
  });

  it("persists individual tag, all, and clear changes", async () => {
    render(<DeckFilterHarness deck={deck} tags={tags} />);

    await userEvent.click(screen.getByText("tag2"));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, selectedTags: ["tag2"] });
    });

    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, selectedTags: tags });
    });

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", { id: deck.id, selectedTags: [] });
    });
  });
});
