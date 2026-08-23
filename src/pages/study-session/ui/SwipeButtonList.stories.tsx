import type { Meta, StoryObj } from "@storybook/react";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { SwipeButtonList } from "./SwipeButtonList";

const meta = {
  title: "Pages/Study Session/SwipeButtonList",
  component: SwipeButtonList,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SwipeButtonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: "dark" } };
