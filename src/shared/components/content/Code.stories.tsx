import type { Meta, StoryObj } from "@storybook/react";

import { Code as Template } from "@/shared/components/content/Code";
import * as fixture from "@/shared/storybook/fixture";

const meta = {
  title: "Shared/Code",
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
