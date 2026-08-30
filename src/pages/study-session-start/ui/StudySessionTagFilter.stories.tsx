import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { StudySessionTagFilter } from "./StudySessionTagFilter";

type StudySessionTagFilterProps = React.ComponentProps<typeof StudySessionTagFilter>;

const tags = Array.from({ length: 12 }, (_, index) => `tag-${String(index + 1)}`);

const InteractiveStudySessionTagFilter: React.FC<StudySessionTagFilterProps> = (props) => {
  const [matchAll, setMatchAll] = React.useState(props.matchAll);
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags);

  return (
    <StudySessionTagFilter
      {...props}
      matchAll={matchAll}
      selectedTags={selectedTags}
      onMatchAllChange={(value) => {
        props.onMatchAllChange(value);
        setMatchAll(value);
      }}
      onSelectedTagsChange={(value) => {
        props.onSelectedTagsChange(value);
        setSelectedTags(value);
      }}
    />
  );
};

const meta = {
  title: "Pages/Study Session Start/StudySessionTagFilter",
  component: StudySessionTagFilter,
  tags: ["autodocs"],
  args: {
    tags,
    selectedTags: [],
    matchAll: false,
    onSelectedTagsChange: fn(),
    onMatchAllChange: fn(),
  },
  render: (args) => <InteractiveStudySessionTagFilter {...args} />,
} satisfies Meta<typeof StudySessionTagFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Collapsed: Story = {};

export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    const disclosure = canvas.getByRole("button", { name: "Show 4 more tags" });
    await userEvent.click(disclosure);

    await expect(canvas.getAllByRole("checkbox")).toHaveLength(12);
    await expect(canvas.getByRole("button", { name: "Show fewer tags" })).toHaveAttribute("aria-expanded", "true");
  },
};

export const Selected: Story = {
  args: { selectedTags: ["tag-12", "tag-3"], matchAll: true },
};

export const Empty: Story = {
  args: { tags: [] },
};

export const LongTag: Story = {
  args: { tags: ["averylongunbrokentag".repeat(12)] },
};

export const Mobile320: Story = {
  args: { selectedTags: ["tag-12", "tag-3"] },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { selectedTags: ["tag-12", "tag-3"] },
  globals: { theme: "dark" },
};
