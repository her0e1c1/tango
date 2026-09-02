import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import * as fixture from "@/storybook/fixture";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { StudySessionFilters } from "./StudySessionFilters";
import { StudySessionStart } from "./StudySessionStart";

const Filters: React.FC<{
  initialSelectedTags: string[];
  initialTagAndFilter: boolean;
  tags: readonly string[];
}> = (props) => {
  const [difficultyMax, setDifficultyMax] = React.useState<number | null>(8);
  const [difficultyMin, setDifficultyMin] = React.useState<number | null>(3);
  const [selectedTags, setSelectedTags] = React.useState(props.initialSelectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.initialTagAndFilter);

  return (
    <StudySessionFilters
      difficultyLowerBound={1}
      difficultyMax={difficultyMax}
      difficultyMin={difficultyMin}
      difficultyUpperBound={10}
      tags={[...props.tags]}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      dirty
      saving={false}
      save={async () => undefined}
      clearDifficultyRange={() => {
        setDifficultyMax(null);
        setDifficultyMin(null);
      }}
      setDifficultyMax={setDifficultyMax}
      setDifficultyMin={setDifficultyMin}
      setSelectedTags={setSelectedTags}
      setTagAndFilter={setTagAndFilter}
    />
  );
};

const filters = (selectedTags: string[] = [], tagAndFilter = false, tags: readonly string[] = fixture.tags.default) => (
  <Filters initialSelectedTags={selectedTags} initialTagAndFilter={tagAndFilter} tags={tags} />
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
    filterSlot: filters([...fixture.tags.toolong.slice(0, 12)], true, fixture.tags.toolong),
  },
};
export const DisabledStart: Story = {
  args: { cardsLength: 0, filterSlot: filters(["tag 1", "tag 3"], true) },
};
export const Dark: Story = { ...ManyCardsAndCombinedFilters, globals: { theme: "dark" } };
export const Mobile320LongDeck: Story = {
  args: {
    deckName: fixture.deck.tooLongName.name,
    filterSlot: filters([...fixture.tags.toolong.slice(0, 12)], true, fixture.tags.toolong),
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
export const Mobile375SafeArea: Story = {
  ...ManyCardsAndCombinedFilters,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Mobile375DarkEmpty: Story = {
  args: {
    cardsLength: 0,
    deckName: fixture.deck.tooLongName.name,
    filterSlot: filters([...fixture.tags.toolong.slice(0, 12)], true, fixture.tags.toolong),
  },
  globals: { theme: "dark", viewport: { value: "iphonex", isRotated: false } },
};
