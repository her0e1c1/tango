import type { Meta, StoryObj } from "@storybook/react";

import { Header as Template } from "@/shared/components/layout/Header";

const meta = {
  title: "Shared/Header",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  globals: {
    theme: "light",
  },
};

export const MobileDarkFixed: Story = {
  args: {
    dark: true,
    fixed: true,
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};
