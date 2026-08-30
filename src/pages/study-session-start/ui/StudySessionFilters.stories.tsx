import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { fn } from "storybook/test";

import { StudySessionFilters } from "./StudySessionFilters";

type StudySessionFiltersProps = React.ComponentProps<typeof StudySessionFilters>;

const tags = Array.from({ length: 12 }, (_, index) => `tag-${String(index + 1)}`);

const InteractiveStudySessionFilters: React.FC<StudySessionFiltersProps> = (props) => {
  const [scoreMax, setScoreMax] = React.useState(props.scoreMax);
  const [scoreMin, setScoreMin] = React.useState(props.scoreMin);
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.tagAndFilter);

  return (
    <StudySessionFilters
      {...props}
      scoreMax={scoreMax}
      scoreMin={scoreMin}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      clearScoreRange={() => {
        props.clearScoreRange();
        setScoreMax(null);
        setScoreMin(null);
      }}
      setScoreMax={(value) => {
        props.setScoreMax(value);
        setScoreMax(value);
      }}
      setScoreMin={(value) => {
        props.setScoreMin(value);
        setScoreMin(value);
      }}
      setSelectedTags={(value) => {
        props.setSelectedTags(value);
        setSelectedTags(value);
      }}
      setTagAndFilter={(value) => {
        props.setTagAndFilter(value);
        setTagAndFilter(value);
      }}
    />
  );
};

const meta = {
  title: "Pages/Study Session Start/StudySessionFilters",
  component: StudySessionFilters,
  tags: ["autodocs"],
  args: {
    scoreMax: 1,
    scoreMin: -1,
    selectedTags: ["tag-12", "tag-3"],
    tagAndFilter: false,
    tags,
    clearScoreRange: fn(),
    setScoreMax: fn(),
    setScoreMin: fn(),
    setSelectedTags: fn(),
    setTagAndFilter: fn(),
  },
  render: (args) => <InteractiveStudySessionFilters {...args} />,
} satisfies Meta<typeof StudySessionFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoFilters: Story = {
  args: { scoreMax: null, scoreMin: null, selectedTags: [] },
};

export const ManyTags: Story = {
  args: {
    tags: Array.from({ length: 100 }, (_, index) => `tag-${String(index + 1)}`),
    selectedTags: Array.from({ length: 12 }, (_, index) => `tag-${String(index + 1)}`),
    tagAndFilter: true,
  },
};

export const Mobile320: Story = {
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};
