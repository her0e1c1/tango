import type { Meta, StoryObj } from "@storybook/react";

import { Button as Template } from "./Button";

const meta = {
  title: "Atom/Button",
  component: Template,
  tags: ["autodocs"],
  argTypes: { onClick: { action: "onClick" } },
  args: {
    label: "button",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Small: Story = {
  args: { small: true },
};

export const Large: Story = {
  args: { large: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const Primary: Story = {
  args: { primary: true },
};

export const PrimarySmall: Story = {
  args: { primary: true, small: true },
};

export const PrimaryLarge: Story = {
  args: { primary: true, large: true },
};

export const PrimaryDisabled: Story = {
  args: { primary: true, disabled: true },
};
