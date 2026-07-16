import type { Meta, StoryObj } from "@storybook/react";

import { Textarea as Template } from "@/shared/components/forms/Textarea";

const meta = {
  title: "Shared/Textarea",
  component: Template,
  tags: ["autodocs"],
  args: { rows: 4 },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Template rows={3} placeholder="Placeholder content" />
      <Template rows={3} defaultValue="Read-only content" readOnly />
      <Template rows={3} defaultValue="Disabled content" disabled />
    </div>
  ),
};

export const LongValue: Story = {
  args: {
    defaultValue:
      "Long-form text should remain comfortable to read and edit inside the shared textarea. This story provides enough content to demonstrate wrapping, vertical space, and the control surface without changing its native behavior.",
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <Template rows={3} defaultValue="Light surface" />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Template rows={3} defaultValue="Dark surface" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: {
    defaultValue:
      "A longer textarea value demonstrates readable wrapping and comfortable editing on a narrow mobile viewport.",
  },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
