import type { Meta, StoryObj } from "@storybook/react";
import { card, code, deck, math } from "@/storybook/fixture";

import { CardView as Template } from "./CardView";

const meta = {
  title: "Card/CardView",
  component: Template,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { card: card.default, deck: deck.default },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPlainText: Story = {
  args: {
    card: { ...card.default, backText: code.longtext },
    deck: { ...deck.default, category: "raw" },
  },
};
export const LongCode: Story = {
  args: {
    card: { ...card.default, backText: code.default.repeat(40), tags: ["python"] },
    deck: { ...deck.default, category: "raw" },
  },
};
export const LongMath: Story = {
  args: {
    card: { ...card.default, backText: `${math.block}\n${math.block}` },
    deck: { ...deck.default, category: "math" },
  },
};
export const Mobile: Story = { ...LongPlainText, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...LongCode, globals: { theme: "dark" } };
