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

const card = createCard({ id: "card-id", frontText: "Front", backText: "Back", difficulty: 5, tags: [] });
const otherCard = createCard({ id: "other-id", frontText: "Other", backText: "Other back", tags: ["two"] });

describe("CardList [CARD-01] [CARD-10] [CARD-19] [CARD-24]", () => {
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
    const summary = screen.getByText((_, element) => element?.textContent?.startsWith("Filters") === true, {
      selector: "summary",
    });
    expect(summary).toHaveAccessibleName(/Filters\s*difficulty 2–8 · 2 tags/);
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

  it("removes a selected tag via keyboard and keeps visible focus on the remaining tag", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const ControlledCardList = () => {
      const [selectedTags, setSelectedTags] = useState(["one", "two"]);
      return (
        <CardList
          cards={[card]}
          filter={{ difficultyMin: null, difficultyMax: null, selectedTags }}
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

    await user.keyboard("{Enter}");
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");

    const twoChip = screen.getByRole("button", { name: "Remove two filter" });
    expect(twoChip).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "View Front" })).toHaveFocus();
  });

  it("removes the final selected tag via keyboard and moves focus to the filters heading summary", async () => {
    const user = userEvent.setup();
    const onRemoveTag = vi.fn();
    const ControlledCardList = () => {
      const [selectedTags, setSelectedTags] = useState(["two"]);
      return (
        <CardList
          cards={[card]}
          filter={{ difficultyMin: null, difficultyMax: null, selectedTags }}
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

    await user.keyboard(" ");
    expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("two");
    expect(screen.queryByRole("button", { name: "Remove two filter" })).not.toBeInTheDocument();

    const summary = screen.getByText((_, element) => element?.textContent?.startsWith("Filters") === true, {
      selector: "summary",
    });
    expect(summary).toHaveFocus();
    expect(summary).toHaveAccessibleName(/Filters\s*No filters/);
  });

  it("maintains focus order through chips without altering filters during tab navigation", async () => {
    const user = userEvent.setup();
    render(
      <CardList cards={[card]} filter={{ difficultyMin: null, difficultyMax: null, selectedTags: ["one", "two"] }} />
    );

    const oneChip = screen.getByRole("button", { name: "Remove one filter" });
    oneChip.focus();
    expect(oneChip).toHaveFocus();

    await user.tab();
    expect(screen.getByRole("button", { name: "Remove two filter" })).toHaveFocus();

    await user.tab({ shift: true });
    expect(oneChip).toHaveFocus();
  });

  it("shows filter disclosure state", () => {
    render(<CardList cards={[card]} />);
    expect(screen.getByText("Filters")).toBeVisible();
  });

  it("keeps controls hidden until Actions opens and delegates the two choices", async () => {
    const onChangeDifficulty = vi.fn();
    const onAddCard = vi.fn();
    render(<CardList cards={[card, otherCard]} onChangeDifficulty={onChangeDifficulty} onAddCard={onAddCard} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: "New difficulty" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getAllByRole("menuitem")).toHaveLength(2);
    await userEvent.click(screen.getByRole("menuitem", { name: "Change difficulty" }));
    expect(onChangeDifficulty).toHaveBeenCalledOnce();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Add card" }));
    expect(onAddCard).toHaveBeenCalledOnce();
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
    view.rerender(<CardList cards={[card, otherCard]} />);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it.each(["view", "edit"])(
    "preserves the %s target and focus across reorder and other row changes",
    async (target) => {
      const onShowCard = vi.fn();
      const goToEdit = vi.fn();
      const props = { onShowCard, card: { goToEdit } };
      const view = render(<CardList cards={[card, otherCard]} {...props} />);
      if (target === "edit") await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
      const focused =
        target === "view"
          ? screen.getByRole("button", { name: "View Front" })
          : screen.getByRole("menuitem", { name: "Edit" });
      focused.focus();
      view.rerender(<CardList cards={[otherCard, card, createCard({ id: "added", frontText: "Added" })]} {...props} />);
      expect(focused).toHaveFocus();
      view.rerender(<CardList cards={[card]} {...props} />);
      expect(focused).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      expect(target === "view" ? onShowCard : goToEdit).toHaveBeenCalledExactlyOnceWith(card.id);
    }
  );

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
