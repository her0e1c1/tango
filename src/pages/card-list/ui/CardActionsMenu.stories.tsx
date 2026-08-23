import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { CardActionsMenu, type CardActionsMenuProps } from "./CardActionsMenu";

const CardActionsMenuStory = (args: CardActionsMenuProps) => {
  const [open, setOpen] = useState(args.open);

  return (
    <CardActionsMenu
      {...args}
      open={open}
      onToggle={() => {
        args.onToggle();
        setOpen((current) => !current);
      }}
      onClose={() => {
        args.onClose();
        setOpen(false);
      }}
    />
  );
};

const meta = {
  title: "Pages/Card List/CardActionsMenu",
  component: CardActionsMenu,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (StoryComponent) => (
      <div className="flex min-h-20 items-center justify-end rounded-surface border border-border bg-surface px-3 shadow-surface">
        <StoryComponent />
      </div>
    ),
    withPageLayout,
  ],
  args: {
    cardText: "What is a binary search?",
    open: false,
    onToggle: fn(),
    onClose: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof CardActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const Disabled: Story = {
  args: { open: true, disabled: true },
};

export const LongCardText: Story = {
  args: {
    cardText: "A long card prompt remains available in every accessible action label without widening the row".repeat(
      2
    ),
    open: true,
  },
};

export const Interaction: Story = {
  render: (args) => <CardActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.cardText}` }));
    await expect(canvas.getByRole("menu", { name: `Actions for ${args.cardText}` })).toBeVisible();
    await userEvent.click(canvas.getByRole("menuitem", { name: "Edit" }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("menu", { name: `Actions for ${args.cardText}` })).not.toBeInTheDocument();
  },
};

export const Mobile: Story = {
  ...Open,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...Open,
  globals: { theme: "dark" },
};
