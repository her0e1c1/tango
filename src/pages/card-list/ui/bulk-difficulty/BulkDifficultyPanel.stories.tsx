import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { BulkDifficultyPanel } from "./BulkDifficultyPanel";

const meta = {
  title: "Pages/Card List/BulkDifficultyPanel",
  component: BulkDifficultyPanel,
  tags: ["autodocs"],
  args: {
    cardCount: 8,
    difficultyLowerBound: 1,
    difficultyUpperBound: 10,
    selectedDifficulty: 6,
    onDifficultyChange: fn(),
    onRequest: fn(),
  },
} satisfies Meta<typeof BulkDifficultyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { cardCount: 0, selectedDifficulty: null },
};

export const Unselected: Story = {
  args: { selectedDifficulty: null },
};

export const Pending: Story = {
  args: { disabled: true },
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
