import type { DeckStartFormProps } from "@/features/study";
import { DeckStartForm } from "@/features/study";

import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { DeckStartView as View } from "./DeckStartView";

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

const meta = {
  title: "Pages/Deck Start",
  component: View,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: {
    deckName: fixture.deck.default.name,
    maxNumberOfCardsToLearn: fixture.config.default.study.maxNumberOfCardsToLearn,
    cardsLength: 123,
    filterSlot: <DeckStartForm {...deckStartForm} />,
  },
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Long: Story = {
  args: {
    deckName: fixture.deck.tooLongName.name,
    filterSlot: (
      <DeckStartForm
        {...deckStartForm}
        tagFilterProps={{ ...deckStartForm.tagFilterProps, tags: [...fixture.tags.toolong] }}
      />
    ),
  },
};
export const NoMatches: Story = { args: { cardsLength: 0 } };
export const Dark: Story = { ...Long, globals: { theme: "dark" } };
export const Mobile: Story = { ...Long, parameters: { viewport: { defaultViewport: "iphonex" } } };
