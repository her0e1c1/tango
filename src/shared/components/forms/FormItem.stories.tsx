import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "@/shared/components/forms/Button";
import { FormItem as Template } from "@/shared/components/forms/FormItem";
import { Input } from "@/shared/components/forms/Input";
import { Select } from "@/shared/components/forms/Select";
import { Slider } from "@/shared/components/forms/Slider";
import { Switch } from "@/shared/components/forms/Switch";

const meta = {
  title: "Shared/FormItem",
  component: Template,
  tags: ["autodocs"],
  args: {
    label: "label",
    extra: "this is extra",
    children: "text",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TooLongText: Story = {
  args: {
    children: "this is too long text".repeat(30),
  },
};

export const ItemSwitch: Story = {
  args: {
    children: <Switch />,
  },
};

export const ItemSelect: Story = {
  args: {
    children: <Select />,
  },
};

export const ItemButton: Story = {
  args: {
    children: <Button>Login</Button>,
  },
};

export const ItemSlider: Story = {
  args: {
    children: <Slider />,
  },
};

export const ItemInput: Story = {
  args: {
    children: <Input value="value" />,
  },
};
