import type { Meta, StoryObj } from "@storybook/react";

import { TagFilter as Template } from "@/features/deck/components/TagFilter";

const meta = {
  title: "Deck/TagFilter",
  component: Template,
  tags: ["autodocs"],
  args: {
    tags: ["tag1", "tag2", "tag3", "tag4"],
    selectedTags: [],
    tagAndFilter: false,
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

export const ManyTags: Story = {
  args: { tags: Array.from({ length: 40 }, (_, index) => `tag-${index + 1}`) },
};

export const NoMatchCompatible: Story = {
  args: { tags: ["advanced", "review"], selectedTags: ["advanced", "review"], tagAndFilter: true },
};

export const Mobile: Story = { ...ManyTags, parameters: { viewport: { defaultViewport: "iphone5" } } };

export const Dark: Story = { ...Selected, globals: { theme: "dark" } };
