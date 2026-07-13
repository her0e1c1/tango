import type { Meta, StoryObj } from "@storybook/react";

import { Description as Template } from "@src/shared/components/content/Description";

const meta = {
  title: "Shared/Description",
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
  args: { children: "this text is too long".repeat(30) },
};
