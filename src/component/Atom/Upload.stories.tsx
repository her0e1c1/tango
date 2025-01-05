import type { Meta, StoryObj } from "@storybook/react";

import { Upload as Template } from "./Upload";

const meta = {
  title: "Atom/Upload",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onChange: { action: "onChange" },
  },
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
