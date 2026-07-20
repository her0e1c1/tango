/**
 * @file Defines Storybook examples for Tag Label.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { RemovableTag } from "@/components/content/RemovableTag";
import { TagLabel } from "@/components/content/TagLabel";

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
  render: () => <RemovableTag label="TypeScript" onRemove={() => undefined} />,
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
