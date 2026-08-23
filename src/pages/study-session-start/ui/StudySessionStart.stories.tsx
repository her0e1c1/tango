import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { DeckFilterForm } from "@/features/deck-filter";
import * as fixture from "@/storybook/fixture";

import { StudySessionStart } from "./StudySessionStart";

const Filters: React.FC<{ initialSelectedTags: string[]; initialTagAndFilter: boolean }> = (props) => {
  const [scoreMax, setScoreMax] = React.useState<number | null>(1);
  const [scoreMin, setScoreMin] = React.useState<number | null>(-1);
  const [selectedTags, setSelectedTags] = React.useState(props.initialSelectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.initialTagAndFilter);

  return (
    <DeckFilterForm
      scoreMax={scoreMax}
      scoreMin={scoreMin}
      tags={[...fixture.tags.default]}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      setScoreMax={setScoreMax}
      setScoreMin={setScoreMin}
      setSelectedTags={setSelectedTags}
      setTagAndFilter={setTagAndFilter}
    />
  );
};

const filters = (selectedTags: string[] = [], tagAndFilter = false) => (
  <Filters initialSelectedTags={selectedTags} initialTagAndFilter={tagAndFilter} />
);

const meta = {
  title: "Pages/Study Session Start/StudySessionStart",
  component: StudySessionStart,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deckName: fixture.deck.default.name,
    maxNumberOfCardsToLearn: 24,
    cardsLength: 123,
    filterSlot: filters(),
    onClickStart: fn(),
  },
} satisfies Meta<typeof StudySessionStart>;

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
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
