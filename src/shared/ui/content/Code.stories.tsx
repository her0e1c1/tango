import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Tablet: Story = {
  args: { ...WideMobile.args, text: `${WideMobile.args?.text}\n${meta.args.text}` },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Tablet,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: {
    ...WideMobile.args,
    dark: true,
    text: `// Long TypeScript example\n${WideMobile.args?.text}\n${WideMobile.args?.text}`,
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
