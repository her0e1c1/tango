import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

import { TagFilter } from "./TagFilter";

const meta = {
  title: "Features/Deck Filter/TagFilter",
  component: TagFilter,
  tags: ["autodocs"],
  args: {
    tags: ["tag1", "tag2", "tag3", "tag4"],
    selectedTags: [],
    tagAndFilter: false,
  },
} satisfies Meta<typeof TagFilter>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveTagFilter: React.FC<React.ComponentProps<typeof TagFilter>> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(props.selectedTags ?? []);

  return (
    <TagFilter
      {...props}
      selectedTags={selectedTags}
      onClickTag={(tags) => {
        props.onClickTag?.(tags);
        setSelectedTags(tags);
      }}
    />
  );
};

export const Default: Story = {};

export const Interaction: Story = {
  args: { onClickTag: fn() },
  render: (args) => <InteractiveTagFilter {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const tag = canvas.getByRole("checkbox", { name: "tag1" });
    await userEvent.click(tag);
    await expect(tag).toBeChecked();
    await expect(args.onClickTag).toHaveBeenLastCalledWith(["tag1"]);

    await userEvent.click(tag);
    await expect(tag).not.toBeChecked();
    await expect(args.onClickTag).toHaveBeenLastCalledWith([]);
  },
};

export const AndFilter: Story = {
  args: { tagAndFilter: true },
};

export const Selected: Story = {
  args: { selectedTags: ["tag1", "tag3"] },
};

export const ManyTags: Story = {
  args: { tags: Array.from({ length: 40 }, (_, index) => `tag-${index + 1}`) },
};

export const NoMatchCompatible: Story = {
  args: { tags: ["advanced", "review"], selectedTags: ["advanced", "review"], tagAndFilter: true },
};

export const Mobile: Story = { ...ManyTags, globals: { viewport: { value: "iphone5", isRotated: false } } };

export const LongTagMobile: Story = {
  args: { tags: ["averylongunbrokentag".repeat(12)] },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { ...Selected, globals: { theme: "dark" } };
