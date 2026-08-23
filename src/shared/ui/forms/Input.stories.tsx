import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./Input";

const meta = {
  title: "Shared/Forms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    defaultValue: "this is a value",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Input placeholder="Placeholder value" />
      <Input defaultValue="Read-only value" readOnly />
      <Input defaultValue="Disabled value" disabled />
    </div>
  ),
};

export const Invalid: Story = {
  args: { required: true, defaultValue: "" },
};

export const LongValue: Story = {
  args: {
    defaultValue:
      "A deliberately long single-line value demonstrates how the shared input behaves when content exceeds its available width.",
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <Input defaultValue="Light surface" />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Input defaultValue="Dark surface" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { defaultValue: "A long value on a narrow mobile viewport" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
