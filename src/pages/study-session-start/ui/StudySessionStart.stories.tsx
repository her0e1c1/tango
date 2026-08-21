import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { StudySessionStart as Template } from "./StudySessionStart";

const meta = {
  title: "Pages/Study Session Start/StudySessionStart",
  component: Template,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: {
    deckName: fixture.deck.default.name,
    maxNumberOfCardsToLearn: fixture.preferences.default.study.maxNumberOfCardsToLearn,
    cardsLength: 123,
    filterSlot: <div>Filter controls</div>,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Long: Story = {
  args: { deckName: fixture.deck.tooLongName.name },
};
export const NoMatches: Story = { args: { cardsLength: 0 } };
export const Dark: Story = { ...Long, globals: { theme: "dark" } };
export const Mobile: Story = { ...Long, parameters: { viewport: { defaultViewport: "iphonex" } } };
