import type { Meta, StoryObj } from "@storybook/react";

import { Input as Template } from "@/shared/components/forms/Input";

const meta = {
  title: "Shared/Input",
  component: Template,
  tags: ["autodocs"],
  args: {
    defaultValue: "this is a value",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
