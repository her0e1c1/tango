import type { Meta, StoryObj } from "@storybook/react";

import { Upload as Template } from "@src/shared/components/forms/Upload";

const meta = {
  title: "Shared/Upload",
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
