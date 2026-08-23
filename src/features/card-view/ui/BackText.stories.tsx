import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { BackText } from "./BackText";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Features/Card View/BackText",
  component: BackText,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    text: "back text",
    onClick: fn(),
  },
} satisfies Meta<typeof BackText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MathContent: Story = {
  args: {
    text: fixture.math.block,
    category: "math",
  },
};

export const Python: Story = {
  args: {
    text: fixture.code.default,
    category: "python",
    code: true,
  },
};

export const Golang: Story = {
  args: {
    text: fixture.code.default,
    category: "golang",
    code: true,
  },
};
export const LongText: Story = {
  args: {
    text: fixture.code.longtext,
  },
};

export const LongCode: Story = { args: { text: fixture.code.default.repeat(40), category: "python", code: true } };
export const LongMath: Story = { args: { text: `${fixture.math.block}\n${fixture.math.block}`, category: "math" } };
export const Mobile: Story = { ...LongText, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = {
  ...LongCode,
  args: { ...LongCode.args, dark: true },
  globals: { theme: "dark" },
};
