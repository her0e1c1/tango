/**
 * @file Defines Storybook examples for Math.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";

import { MathContent as Template } from "@/components/content/Math";
import * as fixture from "@/storybook/fixture";
import "@/components/content/Math.stories.css";

const meta = {
  title: "Shared/Content/Math",
  component: Template,
  tags: ["autodocs"],
  args: {},
  decorators: [
    (Story) => (
      <div className="math-story">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

const expectTheme = async (canvasElement: HTMLElement) => {
  const content = canvasElement.querySelector(".markdown-body");

  await expect(content).toBeInstanceOf(HTMLElement);
  const style = getComputedStyle(content as Element);
  const parentStyle = getComputedStyle((content as Element).parentElement as Element);
  await expect(style.colorScheme).toBe(parentStyle.colorScheme);
  await expect(style.getPropertyValue("--fgColor-default")).toBe(style.getPropertyValue("--calm-color-ink"));
  await expect(style.getPropertyValue("--bgColor-default")).toBe(style.getPropertyValue("--calm-color-surface"));
};

export const Inline: Story = {
  args: {
    text: fixture.math.inline,
  },
  play: ({ canvasElement }) => expectTheme(canvasElement),
};

export const Block: Story = {
  args: {
    text: fixture.math.block,
  },
};

export const Markdown: Story = {
  args: {
    text: fixture.math.markdown,
  },
};

export const WideMobile: Story = {
  args: { text: "$$\\sum_{i=1}^{n} \\frac{x_i^2 + y_i^2}{\\sqrt{a_i^2 + b_i^2}} = \\prod_{j=1}^{m}(1 + z_j)$$" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = {
  args: { text: fixture.math.markdown },
  globals: { theme: "dark" },
  play: ({ canvasElement }) => expectTheme(canvasElement),
};
