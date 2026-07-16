import type { Meta, StoryObj } from "@storybook/react";

import { Overlay as Template } from "@/shared/components/feedback/Overlay";

const meta = {
  title: "Shared/Overlay",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: { children: "Overlay content" },
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

export const LongMobile: Story = {
  args: {
    position: "center",
    children: "Long overlay content remains readable and scrollable. ".repeat(80),
  },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};

export const Dark: Story = {
  args: { position: "center", children: "Dark-mode overlay surface" },
  globals: { theme: "dark" },
};
