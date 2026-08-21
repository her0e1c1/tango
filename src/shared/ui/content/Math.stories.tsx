/**
 * @file Defines Storybook examples for Math.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { MathContent as Template } from "./Math";

// github-markdown-css follows the browser preference, so the story canvas must use the same theme.
const preferredTheme = globalThis.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const preferredThemeGlobals = { theme: preferredTheme };

const meta = {
  title: "Shared/Content/Math",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    text: fixture.math.inline,
  },
  globals: preferredThemeGlobals,
};

export const Block: Story = {
  args: {
    text: fixture.math.block,
  },
  globals: preferredThemeGlobals,
};

export const Markdown: Story = {
  args: {
    text: fixture.math.markdown,
  },
  globals: preferredThemeGlobals,
};

export const WideMobile: Story = {
  args: { text: "$$\\sum_{i=1}^{n} \\frac{x_i^2 + y_i^2}{\\sqrt{a_i^2 + b_i^2}} = \\prod_{j=1}^{m}(1 + z_j)$$" },
  globals: preferredThemeGlobals,
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
