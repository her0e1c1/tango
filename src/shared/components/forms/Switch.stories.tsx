import type { Meta, StoryObj } from "@storybook/react";

import { Switch as Template } from "@/shared/components/forms/Switch";

const meta = {
  title: "Shared/Forms/Switch",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = {
  args: { checked: true },
};

export const Disabled: Story = {
  args: { checked: true, disabled: true },
};

export const Small: Story = {
  args: { small: true },
};

export const Large: Story = {
  args: { large: true },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex gap-3 bg-canvas p-4">
        <Template />
        <Template checked />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4">
        <Template />
        <Template checked />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
