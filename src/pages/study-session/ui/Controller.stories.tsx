/**
 * @file Defines Storybook examples for Controller.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Controller as Template } from "./Controller";

const meta = {
  title: "Pages/Study Session/Controller",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
    onToggleAutoPlay: { action: "onToggleAutoPlay" },
  },
  args: {
    autoPlay: false,
    index: 3,
    numberOfCards: 24,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AutoPlay: Story = {
  args: {
    autoPlay: true,
  },
};

export const Complete: Story = {
  args: {
    index: 24,
  },
};
