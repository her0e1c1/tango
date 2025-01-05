import type { Meta, StoryObj } from "@storybook/react";

import { TagFilter as Template } from "./";

const meta = {
  title: "Organism/TagFilter",
  component: Template,
  tags: ["autodocs"],
  args: {
    tags: ["tag1", "tag2", "tag3", "tag4"],
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AndFilter: Story = {
  args: { tagAndFilter: true },
};

export const Selected: Story = {
  args: { selectedTags: ["tag1", "tag3"] },
};

export const TooLong: Story = {
  args: { tags: Array(30).fill("tag") },
};

export const TooLongWithScroll: Story = {
  args: { tags: Array(30).fill("tag"), scroll: true },
};
