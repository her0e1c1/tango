import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { DeckFilterForm } from "@/features/deck-filter";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { StudySessionStart as Template } from "./StudySessionStart";

const filters = (selectedTags: string[] = [], tagAndFilter = false) => (
  <DeckFilterForm
    scoreMax={1}
    scoreMin={-1}
    tags={[...fixture.tags.default]}
    selectedTags={selectedTags}
    tagAndFilter={tagAndFilter}
    setScoreMax={fn()}
    setScoreMin={fn()}
    setSelectedTags={fn()}
    setTagAndFilter={fn()}
  />
);

const meta = {
  title: "Pages/Study Session Start/StudySessionStart",
  component: Template,
  tags: ["autodocs"],
  parameters: { viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" } },
  args: {
    deckName: fixture.deck.default.name,
    maxNumberOfCardsToLearn: 24,
    cardsLength: 123,
    filterSlot: filters(),
    onClickStart: fn(),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Long: Story = {
  args: { deckName: fixture.deck.tooLongName.name },
};
export const ManyCardsAndCombinedFilters: Story = {
  args: {
    cardsLength: 1247,
    maxNumberOfCardsToLearn: 0,
    filterSlot: filters(["tag 1", "tag 3"], true),
  },
};
export const DisabledStart: Story = {
  args: { cardsLength: 0, filterSlot: filters(["tag 1", "tag 3"], true) },
};
export const Dark: Story = { ...ManyCardsAndCombinedFilters, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...Long,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
export const ReducedMotion: Story = {
  ...ManyCardsAndCombinedFilters,
};
