import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { BackText } from "./BackText";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Entities/Card/BackText",
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

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <BackText {...args} {...LongText.args} />
      <BackText {...args} {...LongCode.args} />
      <BackText {...args} {...LongMath.args} />
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
      <BackText {...args} {...LongText.args} />
      <BackText {...args} {...LongCode.args} />
      <BackText {...args} {...LongMath.args} />
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
      <BackText {...args} {...LongText.args} />
      <BackText {...args} {...LongCode.args} dark />
      <BackText {...args} {...LongMath.args} />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
