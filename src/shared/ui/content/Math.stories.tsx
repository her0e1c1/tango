import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { MathContent } from "./Math";

const meta = {
  title: "Shared/Content/Math",
  component: MathContent,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof MathContent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    text: fixture.math.inline,
  },
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
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  ...Markdown,
  globals: { theme: "dark" },
};
