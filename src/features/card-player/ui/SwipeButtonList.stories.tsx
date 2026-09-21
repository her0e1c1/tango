import type { Meta, StoryObj } from "@storybook/react";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { SwipeButtonList } from "./SwipeButtonList";

const meta = {
  title: "Features/Card Player/SwipeButtonList",
  component: SwipeButtonList,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SwipeButtonList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const PreviousDisabled: Story = { args: { disabledDirections: { cardSwipeLeft: true } } };
export const RemappedPreviousDisabled: Story = { args: { disabledDirections: { cardSwipeRight: true } } };
export const Disabled: Story = { args: { disabled: true } };
export const Dark: Story = { globals: { theme: "dark" } };

export const Ratings: Story = {
  args: { captions: { cardSwipeLeft: "Again", cardSwipeDown: "Hard", cardSwipeRight: "Good", cardSwipeUp: "Easy" } },
};
