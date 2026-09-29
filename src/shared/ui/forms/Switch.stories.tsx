import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Switch } from "./Switch";

const meta = {
  title: "Shared/Forms/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { "aria-label": "Switch", onChange: fn() },
} satisfies Meta<typeof Switch>;

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
        <Switch {...args} />
        <Switch {...args} checked />
      </div>
      <div className="dark flex gap-3 bg-canvas p-4">
        <Switch {...args} />
        <Switch {...args} checked />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { checked: true },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

function ResponsiveSwitch(args: ComponentProps<typeof Switch>) {
  const [checked, setChecked] = useState(args.checked ?? false);
  return (
    <Switch
      {...args}
      checked={checked}
      onChange={(event) => {
        args.onChange?.(event);
        setChecked(event.target.checked);
      }}
    />
  );
}

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {[{ small: true }, {}, { large: true }].map((size, index) => (
        <div key={index} className="flex gap-4">
          <ResponsiveSwitch {...args} {...size} />
          <ResponsiveSwitch {...args} {...size} checked />
        </div>
      ))}
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <ResponsiveSwitch {...args} />
      <ResponsiveSwitch {...args} checked />
      <ResponsiveSwitch {...args} checked disabled />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <ResponsiveSwitch {...args} />
      <ResponsiveSwitch {...args} checked />
      <ResponsiveSwitch {...args} checked disabled />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
