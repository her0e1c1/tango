import type { Meta, StoryObj } from "@storybook/react-vite";

import { Description } from "./Description";

const meta = {
  title: "Shared/Content/Description",
  component: Description,
  tags: ["autodocs"],
} satisfies Meta<typeof Description>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "this is a description" },
};

export const Short: Story = {
  args: { children: "short" },
};

export const Long: Story = {
  args: { children: "this text is too long ".repeat(30) },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = { args: { children: "Muted dark-mode description" }, globals: { theme: "dark" } };

export const Tablet: Story = {
  ...Long,
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
      <Description {...args} {...Short.args} />
      <Description {...args} {...Long.args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: { children: "学習を続ける前に表示内容と選択した条件を確認してください。".repeat(12) },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
