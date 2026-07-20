/**
 * @file Defines Storybook examples for Card View Template.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { CardViewTemplate as Template } from "@/features/card/components/templates/CardViewTemplate";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Card/CardViewTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { backText: { text: fixture.card.default.backText } },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPlainText: Story = { args: { backText: { text: fixture.code.longtext } } };
export const LongCode: Story = {
  args: { backText: { text: fixture.code.default.repeat(40), category: "python", code: true } },
};
export const LongMath: Story = {
  args: { backText: { text: `${fixture.math.block}\n${fixture.math.block}`, category: "math" } },
};
export const Mobile: Story = { ...LongPlainText, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...LongCode, globals: { theme: "dark" } };
