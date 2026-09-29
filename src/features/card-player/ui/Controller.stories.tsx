import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";
import { expect, fireEvent, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { Controller } from "./Controller";

const InteractiveController: React.FC<React.ComponentProps<typeof Controller>> = (props) => {
  const [autoPlay, setAutoPlay] = React.useState(props.autoPlay ?? false);
  const [index, setIndex] = React.useState(props.index ?? 0);

  return (
    <Controller
      {...props}
      autoPlay={autoPlay}
      index={index}
      onToggleAutoPlay={() => {
        props.onToggleAutoPlay?.();
        setAutoPlay((value) => !value);
      }}
      onChange={(value) => {
        props.onChange?.(value);
        setIndex((current) => Math.max(current, value));
      }}
    />
  );
};

const meta = {
  title: "Features/Card Player/Controller",
  component: Controller,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    autoPlay: false,
    index: 3,
    numberOfCards: 24,
    onChange: fn(),
    onToggleAutoPlay: fn(),
  },
  render: (args) => <InteractiveController {...args} />,
} satisfies Meta<typeof Controller>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Interaction: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-01 Toggle playback", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Play" }));
      await expect(args.onToggleAutoPlay).toHaveBeenCalledOnce();
      await expect(canvas.getByRole("button", { name: "Pause" })).toBePressed();
    });
  },
};

export const AutoPlay: Story = {
  args: {
    autoPlay: true,
  },
};

export const Complete: Story = {
  args: {
    index: 24,
  },
};

export const Saving: Story = { args: { disabled: true } };

export const KeyboardPlayback: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-03 Request playback with Enter", async () => {
      canvas.getByRole("button", { name: "Play" }).focus();
      await userEvent.keyboard("{Enter}");
      await expect(args.onToggleAutoPlay).toHaveBeenCalledOnce();
    });
  },
};

export const ChangePosition: Story = {
  args: { index: 0, numberOfCards: 5 },
  play: async ({ args, canvas, step }) => {
    await step("STORYBOOK-STUDY-CONTROLS-04 Request a numeric position", async () => {
      await fireEvent.change(canvas.getByRole("slider"), { target: { value: "3" } });
      await expect(args.onChange).toHaveBeenLastCalledWith(3);
    });
  },
};

export const Mobile: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {[0, 12, 24].map((index) => (
        <InteractiveController {...args} key={index} index={index} />
      ))}
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const Dark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <InteractiveController {...args} />
      <InteractiveController {...args} autoPlay />
      <InteractiveController {...args} disabled />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDark: Story = {
  ...Saving,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
