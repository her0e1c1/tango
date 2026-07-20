/**
 * @file Defines Storybook examples for Swipe Button List.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { SwipeButtonList as Template } from "@/features/study/components/SwipeButtonList";

const meta = {
  title: "Study/SwipeButtonList",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
