import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Tablet: Story = {
  args: {
    text: `${fixture.math.markdown}\n${WideMobile.args?.text}\n\n| Name | Value |\n| --- | --- |\n| Formula | A long table value |`,
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: { text: `${fixture.math.inline}\n${fixture.math.markdown}\n${fixture.math.block}\n${fixture.math.block}` },
  decorators: [
    (StoryComponent) => (
      <div className="max-w-2xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
