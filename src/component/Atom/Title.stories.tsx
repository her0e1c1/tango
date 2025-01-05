import type { Meta, StoryObj } from "@storybook/react";

import { Title as Template } from "./Title";

const meta = {
  title: "Atom/Title",
  component: Template,
  tags: ["autodocs"],
  args: {
    children: "this is a title",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = {
  args: { onClick: () => {} },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "this text is too long".repeat(30) },
};
