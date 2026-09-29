import type { Meta, StoryObj } from "@storybook/react-vite";

import { Logo } from "./Logo";

const meta = {
  title: "Shared/Content/Logo",
  component: Logo,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wordmark: Story = {
  globals: {
    theme: "light",
  },
};

export const MarkOnly: Story = {
  args: {
    markOnly: true,
  },
  globals: {
    theme: "light",
  },
};

export const Light: Story = {
  globals: {
    theme: "light",
  },
};

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};

export const Mobile: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Logo {...args} />
      <Logo {...args} markOnly />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Logo {...args} />
      <Logo {...args} markOnly />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Logo {...args} />
      <Logo {...args} markOnly />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Logo {...args} />
      <Logo {...args} markOnly />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
