/**
 * @file Defines Storybook examples for Logo.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Logo as Template } from "@/components/content/Logo";

const meta = {
  title: "Shared/Content/Logo",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

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
