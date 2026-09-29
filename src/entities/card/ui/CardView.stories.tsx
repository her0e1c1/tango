import type { Meta, StoryObj } from "@storybook/react-vite";
import * as fixture from "@/storybook/fixture";

import { CardView } from "./CardView";

const meta = {
  title: "Entities/Card/CardView",
  component: CardView,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: { text: fixture.card.default.backText, category: "raw", code: false, dark: false },
} satisfies Meta<typeof CardView>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongPlainText: Story = {
  args: {
    text: fixture.code.longtext,
    category: "raw",
    code: false,
  },
};
export const LongCode: Story = {
  args: {
    text: fixture.code.default.repeat(40),
    category: "python",
    code: true,
  },
};
export const LongMath: Story = {
  args: {
    text: `${fixture.math.block}\n${fixture.math.block}`,
    category: "math",
    code: false,
  },
};
export const Mobile: Story = { ...LongPlainText, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = {
  ...LongCode,
  args: { ...LongCode.args, dark: true },
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <CardView {...args} {...LongPlainText.args} variant="bare" />
      <CardView {...args} variant="bare" {...LongCode.args} />
      <CardView {...args} {...LongMath.args} variant="bare" />
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
      <CardView {...args} {...LongPlainText.args} variant="bare" />
      <CardView {...args} variant="bare" {...LongCode.args} />
      <CardView {...args} {...LongMath.args} variant="bare" />
    </div>
  ),
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
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <CardView {...args} {...LongPlainText.args} variant="bare" />
      <CardView {...args} variant="bare" {...LongCode.args} dark />
      <CardView {...args} {...LongMath.args} variant="bare" />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
