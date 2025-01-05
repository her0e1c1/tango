import type { Meta, StoryObj } from "@storybook/react";

import { Outer as Template } from "./Outer";

const meta = {
  title: "Molecule/Outer",
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
