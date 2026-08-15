/**
 * @file Defines Storybook examples for Back Text.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { BackText as Template } from "./BackText";
import { code, math } from "@/storybook/fixture";

const meta = {
  title: "Card/BackText",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onClick: { action: "onClick" },
  },
  args: {
    text: "back text",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MathContent: Story = {
  args: {
    text: math.block,
    category: "math",
  },
};

export const Python: Story = {
  args: {
    text: code.default,
    category: "python",
    code: true,
  },
};

export const Golang: Story = {
  args: {
    text: code.default,
    category: "golang",
    code: true,
  },
};
export const LongText: Story = {
  args: {
    text: code.longtext,
  },
};

export const LongCode: Story = { args: { text: code.default.repeat(40), category: "python", code: true } };
export const LongMath: Story = { args: { text: `${math.block}\n${math.block}`, category: "math" } };
export const Mobile: Story = { ...LongText, parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { ...LongCode, globals: { theme: "dark" } };
