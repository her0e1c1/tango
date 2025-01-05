import type { Meta, StoryObj } from "@storybook/react";

import { Card as Template } from "./Card";

const meta = {
  title: "Molecule/Card",
  component: Template,
  tags: ["autodocs"],
  args: {
    children: "this is a text",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "this is a text" },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Full: Story = {
  args: { full: true },
};

export const Border: Story = {
  args: { border: true },
};

export const TooLong: Story = {
  args: { children: "this is a too long text".repeat(30) },
};
