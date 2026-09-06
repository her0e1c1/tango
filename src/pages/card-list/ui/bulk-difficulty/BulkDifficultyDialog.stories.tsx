import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { BulkDifficultyDialog } from "./BulkDifficultyDialog";

const meta = {
  title: "Pages/Card List/BulkDifficultyDialog",
  component: BulkDifficultyDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    cardCount: 4,
    difficulty: 7,
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof BulkDifficultyDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmation: Story = {};

export const Pending: Story = {
  args: { pending: true },
};

export const Mobile: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Japanese: Story = {
  parameters: { locale: "ja" },
};
