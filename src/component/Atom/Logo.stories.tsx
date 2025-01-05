import type { Meta, StoryObj } from "@storybook/react";

import { Logo as Template } from "./Logo";

const meta = {
  title: "Atom/Logo",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
