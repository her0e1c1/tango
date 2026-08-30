import type { Meta, StoryObj } from "@storybook/react";

import { Textarea } from "./Textarea";

const meta = {
  title: "Shared/Forms/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  args: { "aria-label": "Text area", rows: 4 },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Invalid: Story = {
  args: { required: true, defaultValue: "" },
};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Textarea aria-label="Placeholder text area" rows={3} placeholder="Placeholder content" />
      <Textarea aria-label="Read-only text area" rows={3} defaultValue="Read-only content" readOnly />
      <Textarea aria-label="Disabled text area" rows={3} defaultValue="Disabled content" disabled />
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
        <Textarea aria-label="Light surface text area" rows={3} defaultValue="Light surface" />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Textarea aria-label="Dark surface text area" rows={3} defaultValue="Dark surface" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: {
    defaultValue:
      "A longer textarea value demonstrates readable wrapping and comfortable editing on a narrow mobile viewport.",
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
