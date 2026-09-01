import type { Meta, StoryObj } from "@storybook/react";

import { DifficultyIndicator } from "@/entities/study-progress";
import * as fixture from "@/storybook/fixture";

import { CardOverlay } from "./CardOverlay";

const meta = {
  title: "Pages/Study Session/CardOverlay",
  component: CardOverlay,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    difficultySlot: <DifficultyIndicator difficulty={1} />,
    numberOfSeen: 4,
    lastSeenAt: fixture.timestamp,
  },
} satisfies Meta<typeof CardOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };
