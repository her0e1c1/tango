import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";

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
        setIndex(value);
      }}
    />
  );
};

const meta = {
  title: "Pages/Study Session/Controller",
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
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Play" }));
    await expect(args.onToggleAutoPlay).toHaveBeenCalledOnce();
    await expect(canvas.getByRole("button", { name: "Pause" })).toBePressed();
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
