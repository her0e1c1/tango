import type { Meta, StoryObj } from "@storybook/react";

import { FrontText as Template } from "@/features/card/components/FrontText";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Card/FrontText",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSwipeUp: { action: "onSwipeUp" },
    onSwipeDown: { action: "onSwipeDown" },
    onSwipeLeft: { action: "onSwipeLeft" },
    onSwipeRight: { action: "onSwipeRight" },
  },
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: fixture.card.default.frontText },
};

export const TooLong: Story = {
  args: { text: fixture.card.toolong.frontText },
};

export const LongMath: Story = { args: { text: `${fixture.math.block}\n${fixture.math.block}`, category: "math" } };
export const Mobile: Story = { ...TooLong, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...TooLong, globals: { theme: "dark" } };
