import type { Meta, StoryObj } from "@storybook/react";

import { Controller as Template } from "./";

const meta = {
  title: "Organism/Controller",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
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
