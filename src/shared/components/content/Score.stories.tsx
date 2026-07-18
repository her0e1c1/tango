import type { Meta, StoryObj } from "@storybook/react";

import { Score as Template } from "@/shared/components/content/Score";

const meta = {
  title: "Shared/Content/Score",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Positive: Story = {
  args: { score: 1 },
};

export const Negative: Story = {
  args: { score: -1 },
};

export const Neutral: Story = {
  args: { score: 0 },
};

export const Positive10: Story = {
  args: { score: 10 },
};

export const Negative10: Story = {
  args: { score: -10 },
};

export const Large: Story = {
  args: { score: 1, large: true },
};

export const Dark: Story = {
  args: { score: 10, large: true },
  globals: { theme: "dark" },
};
