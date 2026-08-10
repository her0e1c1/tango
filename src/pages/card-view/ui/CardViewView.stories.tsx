/**
 * @file Defines Storybook examples for the Card View Page view.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import * as fixture from "@/storybook/fixture";

import { CardViewView as Template } from "./CardViewView";

const meta = {
  title: "Pages/Card View",
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
