import type { Meta, StoryObj } from "@storybook/react";
import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";
import { CardListTemplate as Template } from "@/features/card/components/templates/CardListTemplate";
import { DeckStartForm, type DeckStartFormProps } from "@/features/deck/components/DeckStartForm";
import * as fixture from "@/shared/storybook/fixture";

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
    filterSlot: <DeckStartForm {...deckStartForm} />,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

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

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};

export const IphoneXLong: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
  args: {
    filterSlot: <DeckStartForm {...longDeckStartForm} />,
    cards: fixture.cards.long,
  },
};
