import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { Switch as Template } from "@/components/forms/Switch";

const meta = {
  title: "Shared/Forms/Switch",
  component: Template,
  tags: ["autodocs"],
  args: { onChange: fn() },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  args: { "aria-label": "Interactive switch", onChange: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const control = canvas.getByRole("checkbox", { name: "Interactive switch" });
    await userEvent.click(control);
    await expect(control).toBeChecked();
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

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
  render: (args) => (
    <div className="grid gap-4">
      <div className="flex gap-3 bg-canvas p-4">
        <Template {...args} />
        <Template {...args} checked />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4">
        <Template {...args} />
        <Template {...args} checked />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
