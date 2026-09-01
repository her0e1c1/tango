import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { DeckFilterForm } from "./DeckFilterForm";
import * as fixture from "@/storybook/fixture";

type DeckFilterFormProps = React.ComponentProps<typeof DeckFilterForm>;

const args: DeckFilterFormProps = {
  difficultyLowerBound: 1,
  difficultyMax: 8,
  difficultyMin: 3,
  difficultyUpperBound: 10,
  tags: [...fixture.tags.default],
  selectedTags: [],
  tagAndFilter: false,
  clearDifficultyRange: fn(),
  setDifficultyMax: fn(),
  setDifficultyMin: fn(),
  setSelectedTags: fn(),
  setTagAndFilter: fn(),
};

const InteractiveDeckFilterForm: React.FC<DeckFilterFormProps> = (props) => {
  const [difficultyMax, setDifficultyMax] = React.useState(props.difficultyMax);
  const [difficultyMin, setDifficultyMin] = React.useState(props.difficultyMin);
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.tagAndFilter);

  return (
    <DeckFilterForm
      {...props}
      difficultyMax={difficultyMax}
      difficultyMin={difficultyMin}
      selectedTags={selectedTags}
      tagAndFilter={tagAndFilter}
      clearDifficultyRange={() => {
        props.clearDifficultyRange();
        setDifficultyMax(null);
        setDifficultyMin(null);
      }}
      setDifficultyMax={(value) => {
        props.setDifficultyMax(value);
        setDifficultyMax(value);
      }}
      setDifficultyMin={(value) => {
        props.setDifficultyMin(value);
        setDifficultyMin(value);
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
  title: "Features/Deck Filter/DeckFilterForm",
  component: DeckFilterForm,
  tags: ["autodocs"],
  args,
  render: (storyArgs) => <InteractiveDeckFilterForm {...storyArgs} />,
} satisfies Meta<typeof DeckFilterForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  args: { selectedTags: ["tag 1"] },
  play: async ({ args: storyArgs, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Clear" }));
    await expect(storyArgs.setSelectedTags).toHaveBeenCalledWith([]);
    await expect(canvas.getByRole("checkbox", { name: "tag 1" })).not.toBeChecked();
  },
};

export const ManyTagsSelected: Story = {
  args: {
    tags: Array.from({ length: 40 }, (_, index) => `study-tag-${index + 1}`),
    selectedTags: ["study-tag-2", "study-tag-17", "study-tag-31"],
    tagAndFilter: true,
  },
};

export const NoMatchCompatible: Story = {
  args: {
    selectedTags: ["advanced", "review"],
    tagAndFilter: true,
  },
};

export const SavedFractionalDifficultyRange: Story = {
  args: { difficultyMax: 8.25, difficultyMin: 2.5 },
};

export const InvalidSavedDifficultyRange: Story = {
  args: { difficultyMax: 3, difficultyMin: 5 },
};

export const Mobile: Story = {
  ...ManyTagsSelected,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { ...ManyTagsSelected, globals: { theme: "dark" } };
