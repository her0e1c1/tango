import type { Meta, StoryObj } from "@storybook/react-vite";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { Card } from "./Card";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Pages/Card List/Card",
  component: Card,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="overflow-visible rounded-surface border border-border bg-surface shadow-surface dark:border-black">
      <Card {...args} />
    </div>
  ),
  args: {
    card: fixture.card.default,
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unstudied: Story = {
  args: { card: { ...fixture.card.default } },
};

export const LongText: Story = { args: { card: fixture.card.long } };
export const LongTags: Story = { args: { card: fixture.card.longTags } };
export const ActionsOpen: Story = { args: { menuOpen: true } };
export const Pending: Story = { args: { disabled: true } };
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };

export const Tablet: Story = {
  args: { card: { ...fixture.card.long, tags: fixture.card.longTags.tags } },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Tablet,
  args: { ...Tablet.args, menuOpen: true },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  args: { ...Tablet.args, disabled: false },
  argTypes: { disabled: { control: "boolean" } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
