/**
 * @file Defines Storybook examples for Input.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Input as Template } from "@/components/forms/Input";

const meta = {
  title: "Shared/Forms/Input",
  component: Template,
  tags: ["autodocs"],
  args: {
    defaultValue: "this is a value",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Template placeholder="Placeholder value" />
      <Template defaultValue="Read-only value" readOnly />
      <Template defaultValue="Disabled value" disabled />
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
        <Template defaultValue="Light surface" />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Template defaultValue="Dark surface" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { defaultValue: "A long value on a narrow mobile viewport" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
