import type { Meta, StoryObj } from "@storybook/react";

import { Main as Template } from "@src/shared/components/layout/Main";

const meta = {
  title: "Shared/Main",
  component: Template,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "main content",
  },
};
