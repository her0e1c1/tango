/**
 * @file Verifies the "DeckFilterForm with useDeckFilterState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits score and tag
 * filter changes", "auto-submits score toggle and slider changes", "auto-submits individual tag,
 * all, and clear changes".
 */

import userEvent from "@testing-library/user-event";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/test/factories";
import { DeckFilterHarness } from "./DeckFilterHarness";

const ALL_BUTTON_PATTERN = /all/i;
const CLEAR_BUTTON_PATTERN = /clear/i;

const mocks = vi.hoisted(() => ({ editDeck: vi.fn() }));

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/entities/deck", () => ({ editDeck: mocks.editDeck }));

/**
 * Renders the test-only Deck Filter Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
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
    await userEvent.click(screen.getByRole("button", { name: ALL_BUTTON_PATTERN }));

    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith(
        "user-id",
        expect.objectContaining({ scoreMax: 2, scoreMin: -2, tagAndFilter: true, selectedTags: tags })
      );
    });
  });

  it("persists score toggle and slider changes", async () => {
    render(<DeckFilterHarness deck={{ ...deck, scoreMax: null, scoreMin: null }} tags={tags} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith(
        "user-id",
        expect.objectContaining({ scoreMax: 0, scoreMin: null })
      );
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", expect.objectContaining({ scoreMax: 0, scoreMin: 0 }));
    });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith(
        "user-id",
        expect.objectContaining({ scoreMax: 2, scoreMin: -2 })
      );
    });

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith(
        "user-id",
        expect.objectContaining({ scoreMax: null, scoreMin: null })
      );
    });
  });

  it("persists individual tag, all, and clear changes", async () => {
    render(<DeckFilterHarness deck={deck} tags={tags} />);

    await userEvent.click(screen.getByText("tag2"));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", expect.objectContaining({ selectedTags: ["tag2"] }));
    });

    await userEvent.click(screen.getByRole("button", { name: ALL_BUTTON_PATTERN }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", expect.objectContaining({ selectedTags: tags }));
    });

    await userEvent.click(screen.getByRole("button", { name: CLEAR_BUTTON_PATTERN }));
    await waitFor(() => {
      expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", expect.objectContaining({ selectedTags: [] }));
    });
  });
});
