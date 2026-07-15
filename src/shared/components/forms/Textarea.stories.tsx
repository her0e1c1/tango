import type { Meta, StoryObj } from "@storybook/react";

import { Textarea as Template } from "@/shared/components/forms/Textarea";

const meta = {
  title: "Shared/Textarea",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
