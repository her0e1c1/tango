import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { Code } from "./Code";

const meta = {
  title: "Shared/Content/Code",
  component: Code,
  tags: ["autodocs"],
  args: {
    text: fixture.code.default,
  },
} satisfies Meta<typeof Code>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Python: Story = {
  args: { category: "python" },
};

export const WideMobile: Story = {
  args: {
    category: "typescript",
    text: "const veryWideValue = createValueWithManyArguments(firstArgument, secondArgument, thirdArgument);",
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { category: "python", dark: true },
  globals: { theme: "dark" },
};
