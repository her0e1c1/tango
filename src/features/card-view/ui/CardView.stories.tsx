import type { Meta, StoryObj } from "@storybook/react";
import * as fixture from "@/storybook/fixture";

import { CardView as Template } from "./CardView";

const meta = {
  title: "Card/CardView",
  component: Template,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { text: fixture.card.default.backText, category: "raw", code: false, dark: false },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPlainText: Story = {
  args: {
    text: fixture.code.longtext,
    category: "raw",
    code: false,
  },
};
export const LongCode: Story = {
  args: {
    text: fixture.code.default.repeat(40),
    category: "python",
    code: true,
  },
};
export const LongMath: Story = {
  args: {
    text: `${fixture.math.block}\n${fixture.math.block}`,
    category: "math",
    code: false,
  },
};
export const Mobile: Story = { ...LongPlainText, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...LongCode, globals: { theme: "dark" } };
