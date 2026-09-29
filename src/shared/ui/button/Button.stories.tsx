import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Button } from "./Button";

const meta = {
  title: "Shared/Forms/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    label: "Continue",
    onClick: fn(),
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VariantAndSize: Story = {
  render: () => (
    <div className="grid gap-4">
      {(["primary", "secondary", "quiet", "destructive"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Button key={size} variant={variant} size={size} label={`${variant} ${size}`} />
          ))}
        </div>
      ))}
    </div>
  ),
};

export const Disabled: Story = {
  args: { variant: "primary", disabled: true },
};

export const Loading: Story = {
  args: { variant: "primary", loading: true },
};

export const LightAndDark: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="bg-canvas p-4 text-ink">
        <Button variant="quiet">Light surface</Button>
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Button variant="quiet">Dark surface</Button>
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { variant: "primary", className: "w-full" },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...VariantAndSize,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      <Button {...args} label="Continue studying the remaining cards in this deck" />
      <Button {...args} className="w-full" label="Continue with all selected cards" />
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
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {(["primary", "secondary", "quiet", "destructive"] as const).map((variant) => (
        <Button {...args} key={variant} variant={variant} label={variant} />
      ))}
      <Button {...args} disabled />
      <Button {...args} loading />
    </div>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
