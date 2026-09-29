import type { Meta, StoryObj } from "@storybook/react-vite";

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

export const Tablet: Story = {
  ...HelpAndError,
  args: {
    ...HelpAndError.args,
    label: "A long label explaining the deck name for this collection",
    help: "This name appears in your library and study history. ".repeat(4),
    error: "Please enter a descriptive name before continuing with this collection.",
  },
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <FormItem label="Name" inputId="desktop-name">
        <Input id="desktop-name" defaultValue="Biology" />
      </FormItem>
      <FormItem label="Category" inputId="desktop-category">
        <Select id="desktop-category" options={[{ label: "Biology", value: "biology" }]} />
      </FormItem>
      <FormItem label="Enabled" inputId="desktop-enabled">
        <Switch id="desktop-enabled" />
      </FormItem>
      <FormItem {...args} />
    </div>
  ),
  decorators: [
    (StoryComponent) => (
      <div className="max-w-2xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  args: {
    ...Tablet.args,
    col: true,
    children: (
      <Input
        id="storybook-deck-name"
        aria-describedby="storybook-deck-name-error"
        defaultValue="A long value for the current biology collection"
      />
    ),
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
