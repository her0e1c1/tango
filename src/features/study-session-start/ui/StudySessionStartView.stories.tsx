import type { Meta, StoryObj } from "@storybook/react";

import { deck, preferences } from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { StudySessionStartView as View } from "./StudySessionStartView";

const meta = {
  title: "Study Session Start/StudySessionStartView",
  component: View,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: {
    deckName: deck.default.name,
    maxNumberOfCardsToLearn: preferences.default.study.maxNumberOfCardsToLearn,
    cardsLength: 123,
    filterSlot: <div>Filter controls</div>,
  },
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Long: Story = {
  args: { deckName: deck.tooLongName.name },
};
export const NoMatches: Story = { args: { cardsLength: 0 } };
export const Dark: Story = { ...Long, globals: { theme: "dark" } };
export const Mobile: Story = { ...Long, parameters: { viewport: { defaultViewport: "iphonex" } } };
