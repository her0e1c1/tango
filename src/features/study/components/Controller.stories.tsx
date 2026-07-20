/**
 * @file Defines Storybook examples for Controller.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Controller as Template } from "@/features/study/components/Controller";

const meta = {
  title: "Study/Controller",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
    onToggleAutoPlay: { action: "onToggleAutoPlay" },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AutoPlay: Story = {
  args: {
    numberOfCards: 10,
    autoPlay: true,
    cardInterval: 1,
  },
};
