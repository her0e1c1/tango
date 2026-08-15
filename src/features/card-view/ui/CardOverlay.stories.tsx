/**
 * @file Defines Storybook examples for Card Overlay.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { CardOverlay as Template } from "./CardOverlay";
import { createStudyProgress } from "@/test/factories";

const meta = {
  title: "Card/CardOverlay",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    progress: createStudyProgress({ score: 3, numberOfSeen: 5 }),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { globals: { theme: "dark" } };
