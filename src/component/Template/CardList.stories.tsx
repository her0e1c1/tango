import type { Meta, StoryObj } from "@storybook/react";
import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import { CardList as Template } from "@src/component/Template";
import type { DeckStartFormProps } from "@src/features/deck/components/DeckStartForm";
import * as fixture from "@src/shared/storybook/fixture";

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
  title: "Template/CardList",
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
    deck: fixture.deck.default,
    cards: fixture.cards.default,
    deckStartForm,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Long: Story = {
  args: {
    deckStartForm: longDeckStartForm,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: {
    showCard: fixture.card.default,
  },
};

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
    deckStartForm: longDeckStartForm,
    cards: fixture.cards.long,
  },
};
