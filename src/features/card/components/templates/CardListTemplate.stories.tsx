import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { CardListTemplate as Template } from "@/features/card/components/templates/CardListTemplate";
import { DeckStartForm, type DeckStartFormProps } from "@/components/deck/DeckStartForm";
import * as fixture from "@/storybook/fixture";

const deckStartForm: DeckStartFormProps = {
  scoreMax: 1,
  scoreMin: -1,
  scoreMaxSwitchProps: { name: "scoreMaxSwitch", checked: true, onChange: () => undefined },
  scoreMinSwitchProps: { name: "scoreMinSwitch", checked: true, onChange: () => undefined },
  scoreMaxSliderProps: { name: "scoreMax", value: "1", min: -10, max: 10, onChange: () => undefined },
  scoreMinSliderProps: { name: "scoreMin", value: "-1", min: -10, max: 10, onChange: () => undefined },
  tagFilterProps: {
    tags: [...fixture.tags.default],
    selectedTags: [],
    tagAndFilter: false,
    onClickFilter: () => undefined,
    onClickAll: () => undefined,
    onClickClear: () => undefined,
    onClickTag: () => undefined,
  },
};

const longDeckStartForm: DeckStartFormProps = {
  ...deckStartForm,
  tagFilterProps: { ...deckStartForm.tagFilterProps, tags: [...fixture.tags.toolong] },
};

const activeFilter = { scoreMax: 1, scoreMin: -1, selectedTags: ["tag 1", "tag 2"] };
const longUnbrokenTag =
  "tag_this_is_one_genuinely_long_unbroken_value_that_must_never_force_the_mobile_card_list_beyond_the_viewport_width_even_when_it_keeps_going_0123456789";
const longUnbrokenCards = fixture.cards.long.map((card, index) =>
  index === 0 ? { ...card, tags: [longUnbrokenTag] } : card
);

const RemovableSelectedTagsExample = () => {
  const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
  return (
    <Template
      cards={fixture.cards.default}
      filter={{ scoreMin: null, scoreMax: null, selectedTags }}
      onRemoveTag={(tag) => setSelectedTags((values) => values.filter((value) => value !== tag))}
    />
  );
};

const meta = {
  title: "Card/CardListTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    cards: fixture.cards.default,
    filter: activeFilter,
    filterSlot: <DeckStartForm {...deckStartForm} />,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const RemovableSelectedTags: Story = {
  render: () => <RemovableSelectedTagsExample />,
};

export const Long: Story = {
  args: {
    filterSlot: <DeckStartForm {...longDeckStartForm} />,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: {
    overlay: {
      backText: {
        text: fixture.card.default.backText,
        category: fixture.deck.default.category,
      },
      onClose: () => undefined,
    },
  },
};

export const DarkCardView: Story = { ...CardView, globals: { theme: "dark" } };

export const Dark: Story = { globals: { theme: "dark" } };

export const Pending: Story = {
  args: { isCardPending: (id) => id === fixture.cards.default[0]?.id },
};

export const IphoneX: Story = {
  parameters: { viewport: { defaultViewport: "iphonex" } },
};

export const IphoneXLong: Story = {
  parameters: { viewport: { defaultViewport: "iphonex" } },
  args: {
    filterSlot: <DeckStartForm {...longDeckStartForm} />,
    filter: { scoreMax: 1, scoreMin: -1, selectedTags: [longUnbrokenTag] },
    cards: longUnbrokenCards,
  },
};
