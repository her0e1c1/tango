/**
 * @file Defines Storybook examples for Title.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Title as Template } from "@/components/content/Title";

const meta = {
  title: "Shared/Content/Title",
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
  args: {
    onClick: () => {
      /* intentional no-op */
    },
  },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "one-continuous-title-that-remains-readable-on-a-narrow-mobile-screen" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};
