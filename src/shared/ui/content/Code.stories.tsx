/**
 * @file Defines Storybook examples for Code.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { Code as Template } from "./Code";

const meta = {
  title: "Shared/Content/Code",
  component: Template,
  tags: ["autodocs"],
  args: {
    text: fixture.code.default,
  },
} satisfies Meta<typeof Template>;

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
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = {
  args: { category: "python", dark: true },
  globals: { theme: "dark" },
};
