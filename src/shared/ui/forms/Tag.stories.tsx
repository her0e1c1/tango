import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Tag } from "./Tag";

const meta = {
  title: "Shared/Forms/Tag",
  component: Tag,
  tags: ["autodocs"],
  args: {
    label: "tag",
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { small: true },
};

export const Large: Story = {
  args: { large: true },
};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true, label: "disabled tag" },
};

export const Clickable: Story = {
  args: {
    onChange: fn(),
  },
};

export const ClickableChecked: Story = {
  args: {
    onChange: fn(),
    checked: true,
  },
};

export const LongLabel: Story = {
  args: { label: "A very long selectable tag label that stays within the available width" },
  decorators: [
    (StoryComponent) => (
      <div className="w-56">
        <StoryComponent />
      </div>
    ),
  ],
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex gap-3 bg-canvas p-4 text-ink">
        <Tag label="Light" />
        <Tag checked label="Selected" />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4 text-ink">
        <Tag label="Dark" />
        <Tag checked label="Selected" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true, label: "Selected on mobile" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {[{ small: true }, {}, { large: true }].map((size, index) => (
        <Tag {...args} {...LongLabel.args} {...size} key={index} />
      ))}
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Tag {...args} onChange={fn()} />
      <Tag {...args} checked onChange={fn()} />
      <Tag {...args} disabled />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Tag {...args} {...LongLabel.args} onChange={fn()} />
      <Tag {...args} {...LongLabel.args} checked onChange={fn()} />
      <Tag {...args} {...LongLabel.args} disabled />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
