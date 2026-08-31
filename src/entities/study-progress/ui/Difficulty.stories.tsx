import type { Meta, StoryObj } from "@storybook/react";

import { Difficulty } from "./Difficulty";

const meta = {
  title: "Entities/StudyProgress/Difficulty",
  component: Difficulty,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Difficulty>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Easiest: Story = { args: { difficulty: 1 } };
export const Neutral: Story = { args: { difficulty: 5 } };
export const Hardest: Story = { args: { difficulty: 10 } };
export const Decimal: Story = { args: { difficulty: 5.5 } };
export const Large: Story = { args: { difficulty: 5, large: true } };
export const Dark: Story = { args: { difficulty: 10, large: true }, globals: { theme: "dark" } };
