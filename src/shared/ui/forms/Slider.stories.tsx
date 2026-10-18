import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fireEvent, fn } from "storybook/test";

import { Slider } from "./Slider";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const control = canvas.getByRole("slider", { name: "Interactive slider" });
    // When: Exercise `fireEvent.change` with the prepared inputs.
    await fireEvent.change(control, { target: { value: "41" } });
    // Then: Verify the expected result in the assertions below.
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
