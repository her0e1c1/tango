import type { Meta, StoryObj } from "@storybook/react";

import { Header as Template } from "@src/shared/components/Header";

const meta = {
  title: "Shared/Header",
  component: Template,
  tags: ["autodocs"],
  argTypes: {},
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
