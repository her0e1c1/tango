import type { Meta, StoryObj } from "@storybook/react-vite";

import { Header } from "./Header";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Shared/Layout/Header",
  component: Header,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  globals: {
    theme: "light",
  },
};

export const MobileDarkFixed: Story = {
  args: {
    dark: true,
    fixed: true,
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};

export const Mobile: Story = { globals: { viewport: { value: "iphone5", isRotated: false } } };

export const Tablet: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: { dark: true, fixed: false },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
