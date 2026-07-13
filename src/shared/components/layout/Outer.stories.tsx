import type { Meta, StoryObj } from "@storybook/react";

import { Outer as Template } from "@src/shared/components/layout/Outer";

const meta = {
  title: "Shared/Outer",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: "",
  },
};
