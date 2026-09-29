import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Title } from "./Title";

const meta = {
  title: "Shared/Content/Title",
  component: Title,
  tags: ["autodocs"],
  args: {
    children: "this is a title",
  },
} satisfies Meta<typeof Title>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Clickable: Story = {
  args: {
    onClick: fn(),
  },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "one-continuous-title-that-remains-readable-on-a-narrow-mobile-screen" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Title {...args}>長い日本語のタイトルを狭い領域でも読み取れることを確認します</Title>
      <Title {...args}>{"ContinuousTitle123".repeat(12)}</Title>
    </div>
  ),
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Title {...args}>Short title</Title>
      <Title {...args} {...Long.args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Long,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
