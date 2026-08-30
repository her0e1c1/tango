import type { Meta, StoryObj } from "@storybook/react";

import { FrontText } from "./FrontText";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Entities/Card/FrontText",
  component: FrontText,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof FrontText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: fixture.card.default.frontText },
};

export const TooLong: Story = {
  args: { text: fixture.card.toolong.frontText },
};

export const LongMath: Story = { args: { text: `${fixture.math.block}\n${fixture.math.block}`, category: "math" } };
export const Mobile: Story = { ...TooLong, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...TooLong, globals: { theme: "dark" } };
