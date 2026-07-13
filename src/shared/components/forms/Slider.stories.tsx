import type { Meta, StoryObj } from "@storybook/react";

import { Slider as Template } from "@src/shared/components/forms/Slider";

const meta = {
  title: "Shared/Slider",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
