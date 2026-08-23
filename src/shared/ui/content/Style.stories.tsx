import type { Meta, StoryObj } from "@storybook/react";
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
