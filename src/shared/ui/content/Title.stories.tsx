import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { Title } from "./Title";

const meta = {
  title: "Shared/Content/Title",
  component: Title,
  tags: ["autodocs"],
  args: {
    children: "this is a title",
  },
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = {
  args: {
    onClick: fn(),
  },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "one-continuous-title-that-remains-readable-on-a-narrow-mobile-screen" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};
