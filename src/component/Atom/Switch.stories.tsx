import type { Meta, StoryObj } from "@storybook/react";

import { Switch as Template } from "./Switch";

const meta = {
  title: "Atom/Switch",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Small: Story = {
  args: { small: true },
};

export const Large: Story = {
  args: { large: true },
};
