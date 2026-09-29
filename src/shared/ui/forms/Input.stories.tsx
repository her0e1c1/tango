import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "./Input";

const meta = {
  title: "Shared/Forms/Input",
  component: Input,
  tags: ["autodocs"],
  args: {
    "aria-label": "Text input",
    defaultValue: "this is a value",
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const States: Story = {
  render: () => (
    <div className="grid gap-4">
      <Input aria-label="Placeholder input" placeholder="Placeholder value" />
      <Input aria-label="Read-only input" defaultValue="Read-only value" readOnly />
      <Input aria-label="Disabled input" defaultValue="Disabled value" disabled />
    </div>
  ),
};

export const Invalid: Story = {
  args: { required: true, defaultValue: "" },
};

export const LongValue: Story = {
  args: {
    defaultValue:
      "A deliberately long single-line value demonstrates how the shared input behaves when content exceeds its available width.",
  },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <Input aria-label="Light surface input" defaultValue="Light surface" />
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Input aria-label="Dark surface input" defaultValue="Dark surface" />
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { defaultValue: "A long value on a narrow mobile viewport" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...LongValue,
  args: { ...LongValue.args, defaultValue: String(LongValue.args?.defaultValue).repeat(8) },
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
      <Input {...args} defaultValue="Editable value" />
      <Input {...args} defaultValue="Read-only value" readOnly />
      <Input {...args} defaultValue="Disabled value" disabled />
    </div>
  ),
  decorators: [
    (StoryComponent) => (
      <div className="max-w-sm min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Input {...args} {...LongValue.args} />
      <Input {...args} placeholder="Enter a value" defaultValue="" />
      <Input {...args} defaultValue="Read-only value" readOnly />
      <Input {...args} defaultValue="Disabled value" disabled />
      <Input {...args} defaultValue="" required />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
