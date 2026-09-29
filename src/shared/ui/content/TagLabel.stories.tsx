import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { RemovableTag } from "./RemovableTag";
import { TagLabel } from "./TagLabel";

const meta = {
  title: "Shared/Content/TagLabel",
  component: TagLabel,
  tags: ["autodocs"],
  args: { label: "TypeScript" },
} satisfies Meta<typeof TagLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Selected: Story = {
  args: { selected: true },
};

export const LongLabel: Story = {
  args: { label: "A very long tag label that stays within its container" },
  decorators: [
    (StoryComponent) => (
      <div className="w-48">
        <StoryComponent />
      </div>
    ),
  ],
};

export const Removable: Story = {
  render: () => <RemovableTag label="TypeScript" onRemove={fn()} />,
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex gap-2 bg-canvas p-4 text-ink">
        <TagLabel label="Default" />
        <TagLabel selected label="Selected" />
      </div>
      <div className="dark flex gap-2 bg-canvas p-4 text-ink">
        <TagLabel label="Default" />
        <TagLabel selected label="Selected" />
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <TagLabel {...args} {...LongLabel.args} />
      <TagLabel {...args} {...LongLabel.args} selected />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Mobile,
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
      <TagLabel {...args} />
      <TagLabel {...args} {...LongLabel.args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
