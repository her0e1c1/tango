import type { Meta, StoryObj } from "@storybook/react-vite";

import { FrontText } from "./FrontText";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Entities/Card/FrontText",
  component: FrontText,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof FrontText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { text: fixture.card.default.frontText },
};

export const TooLong: Story = {
  args: { text: fixture.card.toolong.frontText },
};

export const LongMath: Story = { args: { text: `${fixture.math.block}\n${fixture.math.block}`, category: "math" } };
export const Mobile: Story = { ...TooLong, globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { ...TooLong, globals: { theme: "dark" } };

export const ViewMode: Story = { ...TooLong, args: { ...TooLong.args, viewMode: true } };

export const Tablet: Story = {
  ...TooLong,
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <FrontText {...args} {...TooLong.args} />
      <FrontText {...args} {...LongMath.args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...TooLong,
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <FrontText {...args} {...TooLong.args} />
      <FrontText {...args} {...TooLong.args} viewMode />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
