import type { Meta, StoryObj } from "@storybook/react";
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
