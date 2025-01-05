import type { Meta, StoryObj } from "@storybook/react";

import { Input as Template } from "./Input";

const meta = {
  title: "Atom/Input",
  component: Template,
  tags: ["autodocs"],
  args: {
    defaultValue: "this is a value",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
