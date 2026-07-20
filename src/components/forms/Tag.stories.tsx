/**
 * @file Defines Storybook examples for Tag.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Tag as Template } from "@/components/forms/Tag";

const meta = {
  title: "Shared/Forms/Tag",
  component: Template,
  tags: ["autodocs"],
  args: {
    label: "tag",
  },
} satisfies Meta<typeof Template>;

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
    onChange: () => {
      /* intentional no-op */
    },
  },
};

export const ClickableChecked: Story = {
  args: {
    onChange: () => {
      /* intentional no-op */
    },
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
        <Template label="Light" />
        <Template checked label="Selected" />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4 text-ink">
        <Template label="Dark" />
        <Template checked label="Selected" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true, label: "Selected on mobile", round: true },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
