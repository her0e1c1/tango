/**
 * @file Defines Storybook examples for Card Overlay.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { CardOverlay as Template } from "@/features/card/components/CardOverlay";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Card/CardOverlay",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    card: fixture.card.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { globals: { theme: "dark" } };
