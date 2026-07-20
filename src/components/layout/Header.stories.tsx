/**
 * @file Defines Storybook examples for Header.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Header as Template } from "@/components/layout/Header";

const meta = {
  title: "Shared/Layout/Header",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  globals: {
    theme: "light",
  },
};

export const MobileDarkFixed: Story = {
  args: {
    dark: true,
    fixed: true,
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};
