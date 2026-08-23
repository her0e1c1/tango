import type { Meta, StoryObj } from "@storybook/react";

import { Description } from "./Description";

const meta = {
  title: "Shared/Content/Description",
  component: Description,
  tags: ["autodocs"],
} satisfies Meta<typeof Description>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "this is a description" },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "this text is too long ".repeat(30) },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { args: { children: "Muted dark-mode description" }, globals: { theme: "dark" } };
