import type { Meta, StoryObj } from "@storybook/react";

import { Overlay as Template } from "@src/shared/components/Overlay";

const meta = {
  title: "Shared/Overlay",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    className: "bg-gray-300",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Center: Story = {
  args: {
    position: "center",
  },
};

export const Left: Story = {
  args: {
    position: "left",
  },
};

export const Right: Story = {
  args: {
    position: "right",
  },
};

export const Top: Story = {
  args: {
    position: "top",
  },
};

export const Bottom: Story = {
  args: {
    position: "bottom",
  },
};
