import type { Meta, StoryObj } from "@storybook/react";

import { Button } from "../button";
import { FormItem } from "./FormItem";
import { Input } from "./Input";
import { Select } from "./Select";
import { Slider } from "./Slider";
import { Switch } from "./Switch";

const meta = {
  title: "Shared/Forms/FormItem",
  component: FormItem,
  tags: ["autodocs"],
  args: {
    label: "Deck owner",
    help: "This supporting text explains the displayed value.",
    children: "Alex Morgan",
  },
} satisfies Meta<typeof FormItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HelpAndError: Story = {
  args: {
    label: "Deck name",
    help: "Shown in your library and study history.",
    error: "A deck name is required.",
    children: <Input defaultValue="" />,
    col: true,
  },
};

export const LongLabelAndValue: Story = {
  args: {
    label: "A deliberately long label that demonstrates wrapping on compact screens",
    children: "A long read-only value can wrap without pushing the shared form beyond the available content width.",
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
    children: <Input defaultValue="value" />,
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <FormItem label="Light surface" help="Supporting copy remains quiet.">
          Value
        </FormItem>
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <FormItem label="Dark surface" help="Supporting copy remains quiet." error="Error copy stays distinct.">
          Value
        </FormItem>
      </div>
    </div>
  ),
};

export const NarrowMobile: Story = {
  args: {
    col: true,
    label: "A long mobile label that wraps before the control",
    help: "The item stacks at narrow widths.",
    children: <Input defaultValue="Compact value" />,
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
