import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { Style } from "./Style";

const meta = {
  title: "Shared/Content/Style",
  component: Style,
  tags: ["autodocs"],
  args: {
    children: "Shared rich-content text",
  },
} satisfies Meta<typeof Style>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};

export const Block: Story = {
  args: {
    div: true,
    children: (
      <>
        <strong>Important:</strong> block content can wrap naturally inside the reading surface.
      </>
    ),
  },
};

export const LongContent: Story = {
  args: {
    div: true,
    children: "A long unbroken value remains inside the content area: supercalifragilisticexpialidocious".repeat(4),
  },
};

export const Interaction: Story = {
  args: {
    onClick: fn(),
    children: "Click this styled content",
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("Click this styled content"));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Mobile: Story = {
  ...LongContent,
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  ...Block,
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  ...LongContent,
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
      <Style {...args}>
        Inline text with <strong>emphasis</strong>
      </Style>
      <Style {...args} {...Block.args} />
    </div>
  ),
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: {
    div: true,
    children: (
      <>
        <strong>Important:</strong>
        {" Long content remains readable with emphasis. ".repeat(20)}
      </>
    ),
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
