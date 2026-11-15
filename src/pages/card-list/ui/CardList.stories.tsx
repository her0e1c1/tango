import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { fn } from "storybook/test";
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
const cardViewPreview = (dark: boolean) => ({
  title: "Code answer",
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
  const { preview: initialPreview, ...rest } = props;
  const [preview, setPreview] = React.useState(initialPreview);

  return (
    <CardList
      {...rest}
      {...(preview !== undefined
        ? {
            preview: {
              ...preview,
              onClose: () => {
                preview.onClose?.();
                setPreview(undefined);
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
};

export const IntervalZero: Story = {
  args: {
    cards: [],
    empty: {
      reason: "interval-zero",
    },
    filter: { selectedTags: [] },
  },
};

export const ViewCard: Story = {
  args: { onShowCard: fn() },
};

export const RemovableSelectedTags: Story = {
  args: { onRemoveTag: fn() },
  render: (args) => <RemovableSelectedTagsExample onRemoveTag={args.onRemoveTag} />,
};

export const Long: Story = {
  args: {
    filterSlot: <div>Many filter controls</div>,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: { preview: cardViewPreview(false) },
};

export const DarkCardView: Story = {
  args: { preview: cardViewPreview(true) },
  globals: { theme: "dark" },
};

export const CardViewInteraction: Story = {
  args: { preview: cardViewPreview(false) },
  render: (args) => <ClosableCardViewExample {...args} />,
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
};

export const FilterSaving: Story = { args: { disabled: true, sortOrder: "newest" } };
export const CardSaving: Story = { args: { disabled: true, sortDisabled: true } };

export const UnconfirmedEmpty: Story = {
  args: { cards: [], filter: { selectedTags: [] } },
};

export const LongSelectedTag: Story = {
  args: { filter: { selectedTags: [`tag-${"unbroken".repeat(30)}`] } },
};

export const EmptyAddRequest: Story = {
  args: Empty.args ?? {},
};

export const EmptyClearRequest: Story = {
  args: FilterZero.args ?? {},
};

export const EditTarget: Story = {
  args: { cards: [{ id: "card", frontText: "Front", tags: ["one", "two"] }], card: { goToEdit: fn() } },
};

export const PendingRow: Story = {
  args: { cards: [{ id: "card", frontText: "Front", tags: [] }], card: { disabled: true } },
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
};
function reorderedRowStory(): Story {
  return {
    args: { onShowCard: fn(), card: { goToEdit: fn() } },
    render: (args) => <ChangingRowsExample {...args} />,
  };
}
export const ReorderedView = reorderedRowStory();
export const ReorderedEdit = reorderedRowStory();

export const Tablet: Story = {
  ...Long,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Long,

  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Long,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDarkEmpty: Story = {
  args: FilterZero.args ?? {},
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
