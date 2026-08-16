/**
 * @file Verifies the "DeckFilterForm with useDeckFilterState" contract with automated examples.
 * The examples make the expected behavior concrete by remounting the form from its saved Deck.
 */

import type { DeckId } from "@/entities/deck";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createDeck } from "@/entities/deck";
import { createLocalDeck } from "@/test/factories";
import { DeckFilterForm } from "../ui/DeckFilterForm";
import { useDeckFilterState } from "./useDeckFilterState";

vi.mock("@/entities/auth", () => ({
  useAuthUid: () => "user-id",
}));
vi.mock("@/shared/firebase", () => ({ db: {} }));

/**
 * Renders the test-only Deck Filter Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const DeckFilterHarness: React.FC<{
  deckId: DeckId;
  tags: string[];
}> = ({ deckId, tags }) => {
  const deckFilter = useDeckFilterState(deckId);
  return <DeckFilterForm {...deckFilter} tags={tags} />;
};

describe("DeckFilterForm with useDeckFilterState", () => {
  const deckId = "filter-deck";
  const tags = ["tag1", "tag2", "tag3"];

  it("restores score and tag mode changes from the saved Deck", async () => {
    await createDeck(
      "",
      createLocalDeck({ id: deckId, scoreMax: 1, scoreMin: -1, tagAndFilter: false, selectedTags: [] })
    );
    const renderFilter = () => render(<DeckFilterHarness deckId={deckId} tags={tags} />);
    const view = renderFilter();

    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Match all selected tags" }));
    await userEvent.click(screen.getByRole("button", { name: /all/i }));

    view.unmount();
    renderFilter();

    expect(screen.getByText("−2 to 2")).toBeInTheDocument();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toHaveValue("-2");
    expect(screen.getByRole("checkbox", { name: "Match all selected tags" })).toBeChecked();
    expect(screen.getByText("AND")).toBeInTheDocument();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).toBeChecked();
  });

  it("restores enabled score limits and later restores their removal", async () => {
    await createDeck("", createLocalDeck({ id: deckId, scoreMax: null, scoreMin: null }));
    const renderFilter = () => render(<DeckFilterHarness deckId={deckId} tags={tags} />);
    let view = renderFilter();

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));
    fireEvent.change(screen.getByRole("slider", { name: "Maximum score value" }), {
      target: { value: 2 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Minimum score value" }), {
      target: { value: -2 },
    });

    view.unmount();
    view = renderFilter();

    expect(screen.getByText("−2 to 2")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enable maximum score" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Enable minimum score" })).toBeChecked();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toHaveValue("2");
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toHaveValue("-2");

    await userEvent.click(screen.getByRole("checkbox", { name: "Enable maximum score" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Enable minimum score" }));

    view.unmount();
    renderFilter();

    expect(screen.getByText("Any score")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Enable maximum score" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Enable minimum score" })).not.toBeChecked();
    expect(screen.getByRole("slider", { name: "Maximum score value" })).toBeDisabled();
    expect(screen.getByRole("slider", { name: "Minimum score value" })).toBeDisabled();
  });

  it("restores individual, all, and cleared tag selections", async () => {
    await createDeck("", createLocalDeck({ id: deckId, selectedTags: [] }));
    const renderFilter = () => render(<DeckFilterHarness deckId={deckId} tags={tags} />);
    let view = renderFilter();

    await userEvent.click(screen.getByRole("checkbox", { name: "tag2" }));
    view.unmount();
    view = renderFilter();
    expect(screen.getByRole("checkbox", { name: "tag1" })).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag2" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "tag3" })).not.toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /all/i }));
    view.unmount();
    view = renderFilter();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).toBeChecked();

    await userEvent.click(screen.getByRole("button", { name: /clear/i }));
    view.unmount();
    renderFilter();
    for (const tag of tags) expect(screen.getByRole("checkbox", { name: tag })).not.toBeChecked();
  });
});
