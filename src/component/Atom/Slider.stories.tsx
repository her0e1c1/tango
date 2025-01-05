import type { Meta, StoryObj } from "@storybook/react";

import { Slider as Template } from "./Slider";

const meta = {
  title: "Atom/Slider",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
