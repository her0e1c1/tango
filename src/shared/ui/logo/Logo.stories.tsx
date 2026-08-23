import type { Meta, StoryObj } from "@storybook/react";

import { Logo } from "./Logo";

const meta = {
  title: "Shared/Content/Logo",
  component: Logo,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {
  globals: {
    theme: "light",
  },
};

export const MarkOnly: Story = {
  args: {
    markOnly: true,
  },
  globals: {
    theme: "light",
  },
};

export const Light: Story = {
  globals: {
    theme: "light",
  },
};

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};
