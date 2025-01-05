import type { Meta, StoryObj } from "@storybook/react";

import { SwipeButtonList as Template } from "./";

const meta = {
  title: "Organism/SwipeButtonList",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
