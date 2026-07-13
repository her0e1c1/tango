import type { Meta, StoryObj } from "@storybook/react";

import { SwipeButtonList as Template } from "@src/features/study/components/SwipeButtonList";

const meta = {
  title: "Study/SwipeButtonList",
  component: Template,
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
