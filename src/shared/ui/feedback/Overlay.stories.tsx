import type { Meta, StoryObj } from "@storybook/react";

import { Overlay } from "./Overlay";

const meta = {
  title: "Shared/Feedback/Overlay",
  component: Overlay,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: { children: "Overlay content" },
} satisfies Meta<typeof Overlay>;

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

export const Transparent: Story = {
  args: {
    position: "center",
    variant: "transparent",
    children: "Content remains visible beneath this overlay",
  },
};

export const LongMobile: Story = {
  args: {
    position: "center",
    children: "Long overlay content remains readable and scrollable. ".repeat(80),
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { position: "center", children: "Dark-mode overlay surface" },
  globals: { theme: "dark" },
};
