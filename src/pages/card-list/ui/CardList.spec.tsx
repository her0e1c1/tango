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
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { createCard } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ auth: {} }));

import { CardList } from "./CardList";

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", tags: [] });
const otherCard = createCard({ id: "other-id", frontText: "Other", backText: "Other back", tags: ["two"] });

describe("CardList [CARD-VIEW-01] [CARD-LIST-ACTIONS-01] [CARD-MANAGEMENT-08] [CARD-LIST-ACTIONS-02]", () => {
  it("renders the heading, zero count, and collapsed no-filter summary", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<CardList cards={[]} filterSlot={<div>Controls</div>} />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 1, name: "Cards" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    expect(screen.getByText("0 cards")).toBeInTheDocument();
    expect(screen.getByText("No filters")).toBeInTheDocument();
    expect(screen.getByText("Filters")).toBeVisible();
    expect(screen.queryByText(/no cards/i)).not.toBeInTheDocument();
  });

  it("preserves a long selected tag without changing its text", () => {
    // Given: Prepare `longTag` and any shared test state below.
    const longTag = `tag-${"unbroken".repeat(30)}`;
    // When: Exercise `render` with the prepared inputs.
    render(<CardList cards={[card]} filter={{ selectedTags: [longTag] }} />);
    const chip = screen.getByText(longTag);

    // Then: Verify the expected result in the assertions below.
    expect(chip).toHaveTextContent(longTag);
  });

  it("removes one selected tag from the persistent filter summary", async () => {
    // Given: Prepare `onRemoveTag` and any shared test state below.
    const onRemoveTag = vi.fn();
    render(<CardList cards={[card]} filter={{ selectedTags: ["one", "two"] }} onRemoveTag={onRemoveTag} />);

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Remove one filter" }));
    // Then: Verify the expected result in the assertions below.
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");
  });

  it("removes a selected tag via keyboard and keeps visible focus on the remaining tag", async () => {
    // Given: Prepare `user`, `onRemoveTag`, `ControlledCardList` and any shared test state below.
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const ControlledCardList = () => {
      const [selectedTags, setSelectedTags] = useState(["one", "two"]);
      return (
        <CardList
          cards={[card]}
          filter={{ selectedTags }}
          onRemoveTag={(tag) => {
            onRemoveTag(tag);
            setSelectedTags((current) => current.filter((item) => item !== tag));
          }}
        />
      );
    };
    render(<ControlledCardList />);

    const oneChip = screen.getByRole("button", { name: "Remove one filter" });
    oneChip.focus();
    expect(oneChip).toHaveFocus();

    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard("{Enter}");
    // Then: Verify the expected result in the assertions below.
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");

    const twoChip = screen.getByRole("button", { name: "Remove two filter" });
    expect(twoChip).toHaveFocus();

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "View Front" })).toHaveFocus();
  });

  it("removes the final selected tag via keyboard and moves focus to the filters heading summary", async () => {
    // Given: Prepare `user`, `onRemoveTag`, `ControlledCardList` and any shared test state below.
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const ControlledCardList = () => {
      const [selectedTags, setSelectedTags] = useState(["two"]);
      return (
        <CardList
          cards={[card]}
          filter={{ selectedTags }}
          onRemoveTag={(tag) => {
            onRemoveTag(tag);
            setSelectedTags((current) => current.filter((item) => item !== tag));
          }}
        />
      );
    };
    render(<ControlledCardList />);

    const twoChip = screen.getByRole("button", { name: "Remove two filter" });
    twoChip.focus();
    expect(twoChip).toHaveFocus();

    // When: Exercise `user.keyboard` with the prepared inputs.
    await user.keyboard(" ");
    // Then: Verify the expected result in the assertions below.
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("two");
    expect(screen.queryByRole("button", { name: "Remove two filter" })).not.toBeInTheDocument();

    const summary = screen.getByText((_, element) => element?.textContent?.startsWith("Filters") === true, {
      selector: "summary",
    });
    expect(summary).toHaveFocus();
    expect(summary).toHaveAccessibleName(/Filters\s*No filters/);
  });

  it("maintains focus order through chips without altering filters during tab navigation", async () => {
    // Given: Prepare `user`, `oneChip` and any shared test state below.
    const user = userEvent.setup();
    render(<CardList cards={[card]} filter={{ selectedTags: ["one", "two"] }} />);

    const oneChip = screen.getByRole("button", { name: "Remove one filter" });
    oneChip.focus();
    expect(oneChip).toHaveFocus();

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab();
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Remove two filter" })).toHaveFocus();

    // When: Exercise `user.tab` with the prepared inputs.
    await user.tab({ shift: true });
    // Then: Verify the expected result in the assertions below.
    expect(oneChip).toHaveFocus();
  });

  it("shows filter disclosure state", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<CardList cards={[card]} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Filters")).toBeVisible();
  });

  it("keeps only one menu open and removes it with a missing row", async () => {
    // Given: Prepare `view` and any shared test state below.
    const view = render(<CardList cards={[card, otherCard]} />);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("menu", { name: "Actions for Front" })).toBeInTheDocument();

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Open actions for Other" }));
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("menu", { name: "Actions for Front" })).not.toBeInTheDocument();
    expect(screen.getByRole("menu", { name: "Actions for Other" })).toBeInTheDocument();

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(<CardList cards={[card]} />);
    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(<CardList cards={[card, otherCard]} />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each(["view", "edit"])(
    "preserves the %s target and focus across reorder and other row changes",
    async (target) => {
      // Given: Prepare `onShowCard`, `goToEdit`, `props` and any shared test state below.
      const onShowCard = vi.fn();
      const goToEdit = vi.fn();
      const props = { onShowCard, card: { goToEdit } };
      const view = render(<CardList cards={[card, otherCard]} {...props} />);
      // When: Exercise `userEvent.click` with the prepared inputs.
      if (target === "edit") await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
      const focused =
        target === "view"
          ? screen.getByRole("button", { name: "View Front" })
          : screen.getByRole("menuitem", { name: "Edit" });
      focused.focus();
      view.rerender(<CardList cards={[otherCard, card, createCard({ id: "added", frontText: "Added" })]} {...props} />);
      // Then: Verify the expected result in the assertions below.
      expect(focused).toHaveFocus();
      // When: Exercise `view.rerender` with the prepared inputs.
      view.rerender(<CardList cards={[card]} {...props} />);
      // Then: Verify the expected result in the assertions below.
      expect(focused).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
      expect(target === "view" ? onShowCard : goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    }
  );

  it("preserves card display and overlay close callbacks", () => {
    // Given: Prepare `onShowCard`, `onClose` and any shared test state below.
    const onShowCard = vi.fn();
    const onClose = vi.fn();
    render(<CardList cards={[card]} onShowCard={onShowCard} overlay={{ content: <div>Overlay back</div>, onClose }} />);

    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "View Front" }));
    // Then: Verify the expected result in the assertions below.
    expect(onShowCard).toHaveBeenCalledExactlyOnceWith(card.id);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(screen.getByRole("button", { name: "Close card" }));
    // Then: Verify the expected result in the assertions below.
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.getByText("Overlay back")).toBeInTheDocument();
  });

  it("renders empty state with Add card action for no-cards", async () => {
    // Given: Prepare `onAdd` and any shared test state below.
    const onAdd = vi.fn();
    render(
      <CardList
        cards={[]}
        empty={{
          reason: "no-cards",
          onAddCard: onAdd,
        }}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "No cards yet" })).toBeInTheDocument();
    expect(screen.getByText("Add cards to start studying this deck.")).toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Add card" }));
    // Then: Verify the expected result in the assertions below.
    expect(onAdd).toHaveBeenCalledOnce();
  });

  it("renders empty state with Clear filters action for filter-zero", async () => {
    // Given: Prepare `onClear` and any shared test state below.
    const onClear = vi.fn();
    render(
      <CardList
        cards={[]}
        empty={{
          reason: "filter-zero",
          onClearFilters: onClear,
        }}
      />
    );

    expect(screen.getByRole("heading", { level: 2, name: "No cards match the active filters" })).toBeInTheDocument();
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    // Then: Verify the expected result in the assertions below.
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("renders interval-zero empty state without Clear filters action", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <CardList
        cards={[]}
        empty={{
          reason: "interval-zero",
        }}
      />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("heading", { level: 2, name: "No cards due for review" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });
});
