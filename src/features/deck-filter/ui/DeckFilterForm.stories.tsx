import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { DeckFilterForm } from "./DeckFilterForm";
import * as fixture from "@/storybook/fixture";

type DeckFilterFormProps = React.ComponentProps<typeof DeckFilterForm>;

const args: DeckFilterFormProps = {
  scoreMax: 1,
  scoreMin: -1,
  tags: [...fixture.tags.default],
  selectedTags: [],
  tagAndFilter: false,
  dirty: true,
  saving: false,
  clearScoreRange: fn(),
  save: fn(async () => undefined),
  setScoreMax: fn(),
  setScoreMin: fn(),
  setSelectedTags: fn(),
  setTagAndFilter: fn(),
};

const InteractiveDeckFilterForm: React.FC<DeckFilterFormProps> = (props) => {
  const [scoreMax, setScoreMax] = React.useState(props.scoreMax);
  const [scoreMin, setScoreMin] = React.useState(props.scoreMin);
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);
  const [tagAndFilter, setTagAndFilter] = React.useState(props.tagAndFilter);

  return (
    <DeckFilterForm
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

export const SavedOutsideStandardScoreRange: Story = {
  args: { scoreMax: 14.25, scoreMin: -12.5 },
};

export const InvalidSavedScoreRange: Story = {
  args: { scoreMax: 3, scoreMin: 5 },
};

export const Mobile: Story = {
  ...ManyTagsSelected,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { ...ManyTagsSelected, globals: { theme: "dark" } };
