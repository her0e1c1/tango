import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fn } from "storybook/test";
import { BackText } from "@/entities/card";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardList } from "./CardList";

const activeFilter = { selectedTags: ["tag 1", "tag 2"] };
const longUnbrokenTag =
  "tag_this_is_one_genuinely_long_unbroken_value_that_must_never_force_the_mobile_card_list_beyond_the_viewport_width_even_when_it_keeps_going_0123456789";
const longUnbrokenCards = fixture.cards.long.map((card, index) =>
  index === 0 ? { ...card, tags: [longUnbrokenTag] } : card
);
const cardViewOverlay = (dark: boolean) => ({
  content: <BackText text={fixture.code.default} category="python" code dark={dark} />,
  onClose: fn(),
});

const RemovableSelectedTagsExample: React.FC<{
  onRemoveTag: React.ComponentProps<typeof CardList>["onRemoveTag"];
}> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
  return (
    <CardList
      cards={fixture.cards.default}
      filter={{ selectedTags }}
      onRemoveTag={(tag) => {
        props.onRemoveTag?.(tag);
        setSelectedTags((values) => values.filter((value) => value !== tag));
      }}
    />
  );
};

const ClosableCardViewExample: React.FC<React.ComponentProps<typeof CardList>> = (props) => {
  const { overlay: initialOverlay, ...rest } = props;
  const [overlay, setOverlay] = React.useState(initialOverlay);

  return (
    <CardList
      {...rest}
      {...(overlay !== undefined
        ? {
            overlay: {
              ...overlay,
              onClose: () => {
                overlay.onClose?.();
                setOverlay(undefined);
              },
            },
          }
        : {})}
    />
  );
};

const meta = {
  title: "Pages/Card List/CardList",
  component: CardList,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    sortOrder: "standard",
    onSortOrderChange: fn(),
    cards: fixture.cards.default,
    filter: activeFilter,
    filterSlot: <div>Filter controls</div>,
  },
} satisfies Meta<typeof CardList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AddCard: Story = {
  args: { onAddCard: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-01 Request card creation", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "Add card" }));
      await expect(args.onAddCard).toHaveBeenCalledOnce();
    });
  },
};

export const Empty: Story = {
  args: {
    cards: [],
    empty: {
      reason: "no-cards",
      onAddCard: fn(),
    },
    filter: { selectedTags: [] },
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-02 Empty card collection", async () => {
      await expect(canvas.getByText("0 cards")).toBeVisible();
      await expect(canvas.getByRole("heading", { name: "No cards yet" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Add card" })).toBeVisible();
    });
  },
};

export const FilterZero: Story = {
  args: {
    cards: [],
    empty: {
      reason: "filter-zero",
      onClearFilters: fn(),
    },
    filter: { selectedTags: ["react"] },
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-03 Empty filtered result", async () => {
      await expect(canvas.getByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Clear filters" })).toBeVisible();
    });
  },
};

export const IntervalZero: Story = {
  args: {
    cards: [],
    empty: {
      reason: "interval-zero",
    },
    filter: { selectedTags: [] },
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-04 No cards due", async () => {
      await expect(canvas.getByRole("heading", { name: "No cards due for review" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
    });
  },
};

export const ViewCard: Story = {
  args: { onShowCard: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-05 View selected card", async () => {
      const [viewButton] = canvas.getAllByRole("button", { name: /^View / });
      const [firstCard] = fixture.cards.default;
      if (viewButton == null || firstCard == null) throw new Error("ViewCard requires at least one Card");

      await userEvent.click(viewButton);

      await expect(args.onShowCard).toHaveBeenCalledWith(firstCard.id);
    });
  },
};

export const RemovableSelectedTags: Story = {
  args: { onRemoveTag: fn() },
  render: (args) => <RemovableSelectedTagsExample onRemoveTag={args.onRemoveTag} />,
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-06 Remove selected tag", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Remove TypeScript filter" }));
      await expect(args.onRemoveTag).toHaveBeenCalledWith("TypeScript");
      await expect(canvas.queryByRole("button", { name: "Remove TypeScript filter" })).not.toBeInTheDocument();
    });
  },
};

export const Long: Story = {
  args: {
    filterSlot: <div>Many filter controls</div>,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: { overlay: cardViewOverlay(false) },
};

export const DarkCardView: Story = {
  args: { overlay: cardViewOverlay(true) },
  globals: { theme: "dark" },
};

export const CardViewInteraction: Story = {
  args: { overlay: cardViewOverlay(false) },
  render: (args) => <ClosableCardViewExample {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-07 Close card overlay", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Close card" }));
      await expect(args.overlay?.onClose).toHaveBeenCalledOnce();
      await expect(canvas.queryByRole("button", { name: "Close card" })).not.toBeInTheDocument();
    });
  },
};

export const Dark: Story = { globals: { theme: "dark" } };

export const IphoneX: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const IphoneXLong: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
  args: {
    filterSlot: <div>Many filter controls</div>,
    filter: { selectedTags: [longUnbrokenTag] },
    cards: longUnbrokenCards,
  },
};

export const NewestAdded: Story = {
  args: { sortOrder: "newest" },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-08 Change sort order", async () => {
      await userEvent.selectOptions(canvas.getByRole("combobox", { name: "Sort order" }), "standard");
      await expect(args.onSortOrderChange).toHaveBeenCalledWith("standard");
    });
  },
};

export const FilterSaving: Story = { args: { disabled: true, sortOrder: "newest" } };
export const CardSaving: Story = { args: { disabled: true, sortDisabled: true } };

export const UnconfirmedEmpty: Story = {
  args: { cards: [], filter: { selectedTags: [] } },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-10 Avoid claiming an unknown empty reason", async () => {
      await expect(canvas.getByRole("heading", { name: "Cards" })).toBeVisible();
      for (const text of ["0 cards", "Filters", "No filters"])
        await expect(canvas.getByText(text, { exact: true })).toBeVisible();
      await expect(canvas.queryByText("No cards yet")).not.toBeInTheDocument();
      await expect(canvas.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
    });
  },
};

export const LongSelectedTag: Story = {
  args: { filter: { selectedTags: [`tag-${"unbroken".repeat(30)}`] } },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-11 Preserve the complete selected tag", async () => {
      await expect(canvas.getByText(`tag-${"unbroken".repeat(30)}`, { exact: true })).toBeVisible();
    });
  },
};

export const EmptyAddRequest: Story = {
  args: Empty.args ?? {},
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-17 Request a card from the empty state", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Add card" }));
      await expect(args.empty?.onAddCard).toHaveBeenCalledOnce();
    });
  },
};

export const EmptyClearRequest: Story = {
  args: FilterZero.args ?? {},
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-18 Request clearing an empty result filter", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
      await expect(args.empty?.onClearFilters).toHaveBeenCalledOnce();
    });
  },
};

export const EditTarget: Story = {
  args: { cards: [{ id: "card", frontText: "Front", tags: ["one", "two"] }], card: { goToEdit: fn() } },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-19 Edit the identified row", async () => {
      await expect(canvas.getByText("one", { exact: true })).toBeVisible();
      await expect(canvas.getByText("two", { exact: true })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Open actions for Front" }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "Edit" }));
      await expect(args.card?.goToEdit).toHaveBeenCalledWith("card");
    });
  },
};

export const PendingRow: Story = {
  args: { cards: [{ id: "card", frontText: "Front", tags: [] }], card: { disabled: true } },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-CARD-LIST-20 Disable both operations in a pending row", async () => {
      await expect(canvas.getByRole("button", { name: "View Front" })).toBeDisabled();
      await expect(canvas.getByRole("button", { name: "Open actions for Front" })).toBeDisabled();
    });
  },
};

const KeyboardTagList = (args: React.ComponentProps<typeof CardList>) => {
  const [selectedTags, setSelectedTags] = React.useState(["one", "two"]);
  return (
    <CardList
      {...args}
      filter={{ selectedTags }}
      onRemoveTag={(tag) => {
        args.onRemoveTag?.(tag);
        setSelectedTags((values) => values.filter((value) => value !== tag));
      }}
    />
  );
};

export const KeyboardTagRemoval: Story = {
  args: { onRemoveTag: fn() },
  render: (args) => <KeyboardTagList {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-14 Tab without removing selected tags", async () => {
      canvas.getByRole("button", { name: "Remove one filter" }).focus();
      await userEvent.tab();
      await expect(canvas.getByRole("button", { name: "Remove two filter" })).toHaveFocus();
      await userEvent.tab({ shift: true });
      await expect(canvas.getByRole("button", { name: "Remove one filter" })).toHaveFocus();
      await expect(args.onRemoveTag).not.toHaveBeenCalled();
    });
    await step("STORYBOOK-CARD-LIST-12 Move focus to the remaining tag", async () => {
      await userEvent.keyboard("{Enter}");
      await expect(args.onRemoveTag).toHaveBeenLastCalledWith("one");
      await expect(canvas.getByRole("button", { name: "Remove two filter" })).toHaveFocus();
      await userEvent.tab();
      await expect(canvas.getAllByRole("button", { name: /^View / })[0]).toHaveFocus();
    });
    await step("STORYBOOK-CARD-LIST-13 Return focus to filters after removing the final tag", async () => {
      canvas.getByRole("button", { name: "Remove two filter" }).focus();
      await userEvent.keyboard(" ");
      await expect(args.onRemoveTag).toHaveBeenLastCalledWith("two");
      await expect(canvas.queryByRole("button", { name: /Remove .* filter/ })).not.toBeInTheDocument();
      await expect(canvas.getByText("No filters").closest("summary")).toHaveFocus();
    });
  },
};

const changingCards = [
  { ...fixture.card.default, frontText: "Front" },
  { ...fixture.card.default, id: "other", frontText: "Other" },
];
function ChangingRowsExample(args: React.ComponentProps<typeof CardList>) {
  const [cards, setCards] = React.useState(changingCards);
  return (
    <>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() =>
          setCards((current) => (current.length === 2 ? current.filter((card) => card.id !== "other") : changingCards))
        }
      >
        Toggle Other
      </button>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => setCards((current) => [...current].reverse())}
      >
        Reverse rows
      </button>
      <CardList {...args} cards={cards} />
    </>
  );
}
export const RemovedMenu: Story = {
  render: (args) => <ChangingRowsExample {...args} />,
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-CARD-LIST-15 Close a removed row menu without reopening it", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open actions for Front" }));
      await userEvent.click(canvas.getByRole("button", { name: "Open actions for Other" }));
      await expect(canvas.queryByRole("menu", { name: "Actions for Front" })).not.toBeInTheDocument();
      await expect(canvas.getAllByRole("menu")).toHaveLength(1);
      await userEvent.click(canvas.getByRole("button", { name: "Toggle Other" }));
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Toggle Other" }));
      await expect(canvas.getByRole("button", { name: "Open actions for Other" })).toBeVisible();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
  },
};
function reorderedRowStory(edit: boolean): Story {
  return {
    args: { onShowCard: fn(), card: { goToEdit: fn() } },
    render: (args) => <ChangingRowsExample {...args} />,
    play: async ({ args, canvas, userEvent, step }) => {
      await step("STORYBOOK-CARD-LIST-16 Preserve the focused card across row updates", async () => {
        if (edit) await userEvent.click(canvas.getByRole("button", { name: "Open actions for Front" }));
        const target = edit
          ? canvas.getByRole("menuitem", { name: "Edit" })
          : canvas.getByRole("button", { name: "View Front" });
        target.focus();
        // External data updates must not take focus from the surviving row.
        canvas.getByRole("button", { name: "Reverse rows" }).click();
        await expect(target).toHaveFocus();
        canvas.getByRole("button", { name: "Toggle Other" }).click();
        await expect(target).toHaveFocus();
        canvas.getByRole("button", { name: "Toggle Other" }).click();
        await expect(target).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(edit ? args.card?.goToEdit : args.onShowCard).toHaveBeenCalledWith(fixture.card.default.id);
      });
    },
  };
}
export const ReorderedView = reorderedRowStory(false);
export const ReorderedEdit = reorderedRowStory(true);
