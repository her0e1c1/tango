import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { RemovableTag } from "./RemovableTag";

const meta = {
  title: "Shared/Content/RemovableTag",
  component: RemovableTag,
  tags: ["autodocs"],
  args: {
    label: "TypeScript",
    onRemove: fn(),
  },
} satisfies Meta<typeof RemovableTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Remove: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove TypeScript filter" }));
    await expect(args.onRemove).toHaveBeenCalledWith("TypeScript");
  },
};

export const LongLabel: Story = {
  args: {
    label: "A very long filter label that truncates within narrow content",
  },
  decorators: [
    (StoryComponent) => (
      <div className="w-48">
        <StoryComponent />
      </div>
    ),
  ],
};

export const Mobile: Story = {
  ...LongLabel,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  ...LongLabel,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => (
    <div className="grid min-w-0 gap-4">
      {["TypeScript", "Biology", "Long label for a collection of study cards"].map((label) => (
        <RemovableTag {...args} key={label} label={label} />
      ))}
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongLabel,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
