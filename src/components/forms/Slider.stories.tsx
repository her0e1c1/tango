/**
 * @file Defines Storybook examples for Slider.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fireEvent, fn } from "storybook/test";

import { Slider as Template } from "@/components/forms/Slider";

const meta = {
  title: "Shared/Forms/Slider",
  component: Template,
  tags: ["autodocs"],
  args: { onChange: fn() },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Renders the Interactive Slider Storybook example with local interactive state.
 * Local state lets readers try the component without connecting it to the full application.
 */
const InteractiveSlider: React.FC<React.ComponentProps<typeof Template>> = (props) => {
  const [value, setValue] = React.useState(props.value ?? "40");

  return (
    <Template
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
      <Template {...args} value="20" />
      <Template {...args} value="70" />
      <Template {...args} value="40" disabled />
    </div>
  ),
};

export const LightAndDark: Story = {
  render: (args) => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4">
        <Template {...args} value="35" />
      </div>
      <div className="dark bg-canvas p-4">
        <Template {...args} value="65" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { value: "55" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
