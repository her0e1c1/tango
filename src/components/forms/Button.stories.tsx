import type { Meta, StoryObj } from "@storybook/react";

import { Button as Template } from "@/components/forms/Button";

const meta = {
  title: "Shared/Forms/Button",
  component: Template,
  tags: ["autodocs"],
  argTypes: { onClick: { action: "onClick" } },
  args: {
    label: "Continue",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const VariantAndSize: Story = {
  render: () => (
    <div className="grid gap-4">
      {(["primary", "secondary", "quiet", "destructive"] as const).map((variant) => (
        <div key={variant} className="flex flex-wrap items-center gap-3">
          {(["sm", "md", "lg"] as const).map((size) => (
            <Template key={size} variant={variant} size={size} label={`${variant} ${size}`} />
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
        <Template variant="quiet">Light surface</Template>
      </div>
      <div className="dark bg-canvas p-4 text-ink">
        <Template variant="quiet">Dark surface</Template>
      </div>
    </div>
  ),
};

export const NarrowViewport: Story = {
  args: { variant: "primary", className: "w-full" },
  parameters: { viewport: { defaultViewport: "iphone5" } },
};
