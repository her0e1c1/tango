import type { Meta, StoryObj } from "@storybook/react";

import { Description as Template } from "@/shared/components/content/Description";

const meta = {
  title: "Shared/Content/Description",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

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
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = { args: { children: "Muted dark-mode description" }, globals: { theme: "dark" } };
