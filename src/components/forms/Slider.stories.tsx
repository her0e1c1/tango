import type { Meta, StoryObj } from "@storybook/react";

import { Slider as Template } from "@/components/forms/Slider";

const meta = {
  title: "Shared/Forms/Slider",
  component: Template,
  tags: ["autodocs"],
  args: {},
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { value: "40" } };

export const Values: Story = {
  render: () => (
    <div className="grid gap-4">
      <Template value="20" />
      <Template value="70" />
      <Template value="40" disabled />
    </div>
  ),
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4">
        <Template value="35" />
      </div>
      <div className="dark bg-canvas p-4">
        <Template value="65" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { value: "55" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
