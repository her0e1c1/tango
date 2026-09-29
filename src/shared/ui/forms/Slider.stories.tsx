import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fireEvent, fn } from "storybook/test";

import { Slider } from "./Slider";

const meta = {
  title: "Shared/Forms/Slider",
  component: Slider,
  tags: ["autodocs"],
  args: { "aria-label": "Slider", onChange: fn() },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof meta>;

const InteractiveSlider: React.FC<React.ComponentProps<typeof Slider>> = (props) => {
  const [value, setValue] = React.useState(props.value ?? "40");

  return (
    <Slider
      {...props}
      value={value}
      onChange={(event) => {
        props.onChange?.(event);
        setValue(event.target.value);
      }}
    />
  );
};

export const Default: Story = { args: { value: "40" } };

export const Interaction: Story = {
  args: { "aria-label": "Interactive slider", value: "40", onChange: fn() },
  render: (args) => <InteractiveSlider {...args} />,
  play: async ({ args, canvas }) => {
    const control = canvas.getByRole("slider", { name: "Interactive slider" });
    await fireEvent.change(control, { target: { value: "41" } });
    await expect(control).toHaveValue("41");
    await expect(args.onChange).toHaveBeenCalledOnce();
  },
};

export const Values: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <Slider {...args} value="20" />
      <Slider {...args} value="70" />
      <Slider {...args} value="40" disabled />
    </div>
  ),
};

export const LightAndDark: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4">
        <Slider {...args} value="35" />
      </div>
      <div className="dark bg-canvas p-4">
        <Slider {...args} value="65" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { value: "55" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {["0", "50", "100"].map((value) => (
        <InteractiveSlider {...args} key={value} value={value} />
      ))}
    </div>
  ),
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: { value: "40" },
  render: (args) => <InteractiveSlider {...args} />,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {["0", "50", "100"].map((value) => (
        <InteractiveSlider {...args} key={value} value={value} />
      ))}
      <Slider {...args} value="40" disabled />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
