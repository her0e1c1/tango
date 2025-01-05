import type { Meta, StoryObj } from "@storybook/react";

import { Score as Template } from "./Score";

const meta = {
  title: "Atom/Score",
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

export const Positive10: Story = {
  args: { score: 10 },
};

export const Negative10: Story = {
  args: { score: -10 },
};

export const Large: Story = {
  args: { score: 1, large: true },
};
