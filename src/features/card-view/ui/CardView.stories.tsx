import type { Meta, StoryObj } from "@storybook/react";
import * as fixture from "@/storybook/fixture";

import { CardView as Template } from "./CardView";

const meta = {
  title: "Card/CardView",
  component: Template,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { card: fixture.card.default, deck: fixture.deck.default },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPlainText: Story = {
  args: {
    card: { ...fixture.card.default, backText: fixture.code.longtext },
    deck: { ...fixture.deck.default, category: "raw" },
  },
};
export const LongCode: Story = {
  args: {
    card: { ...fixture.card.default, backText: fixture.code.default.repeat(40), tags: ["python"] },
    deck: { ...fixture.deck.default, category: "raw" },
  },
};
export const LongMath: Story = {
  args: {
    card: { ...fixture.card.default, backText: `${fixture.math.block}\n${fixture.math.block}` },
    deck: { ...fixture.deck.default, category: "math" },
  },
};
export const Mobile: Story = { ...LongPlainText, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...LongCode, globals: { theme: "dark" } };
