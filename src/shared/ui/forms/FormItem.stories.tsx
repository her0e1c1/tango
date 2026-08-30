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
    inputId: "storybook-deck-name",
    errorId: "storybook-deck-name-error",
    help: "Shown in your library and study history.",
    error: "A deck name is required.",
    children: <Input id="storybook-deck-name" aria-describedby="storybook-deck-name-error" defaultValue="" />,
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
    inputId: "storybook-item-switch",
    children: <Switch id="storybook-item-switch" />,
  },
};

export const ItemSelect: Story = {
  args: {
    inputId: "storybook-item-select",
    children: <Select id="storybook-item-select" />,
  },
};

export const ItemButton: Story = {
  args: {
    children: <Button>Login</Button>,
  },
};

export const ItemSlider: Story = {
  args: {
    inputId: "storybook-item-slider",
    children: <Slider id="storybook-item-slider" />,
  },
};

export const ItemInput: Story = {
  args: {
    inputId: "storybook-item-input",
    children: <Input id="storybook-item-input" defaultValue="value" />,
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
    inputId: "storybook-mobile-input",
    help: "The item stacks at narrow widths.",
    children: <Input id="storybook-mobile-input" defaultValue="Compact value" />,
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};
