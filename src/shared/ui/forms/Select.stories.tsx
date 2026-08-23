import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";

import { Select } from "./Select";

const meta = {
  title: "Shared/Forms/Select",
  component: Select,
  tags: ["autodocs"],
  args: {
    options: fixture.form.options.default,
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: { empty: true },
};

export const Invalid: Story = {
  args: { empty: true, required: true, defaultValue: "" },
};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Select options={fixture.form.options.default} />
      <Select options={fixture.form.options.default} empty />
      <Select options={fixture.form.options.default} disabled />
    </div>
  ),
};

export const LongValue: Story = {
  args: {
    options: [
      {
        label: "A deliberately long selected option demonstrates how the shared select behaves at constrained widths",
        value: "long",
      },
    ],
    defaultValue: "long",
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <Select options={fixture.form.options.default} />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Select options={fixture.form.options.default} />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: {
    options: [{ label: "A long option in a narrow mobile viewport", value: "mobile" }],
    defaultValue: "mobile",
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
