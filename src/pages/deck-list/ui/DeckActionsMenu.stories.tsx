import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { DeckActionsMenu, type DeckActionsMenuProps } from "./DeckActionsMenu";

const DeckActionsMenuStory = (args: DeckActionsMenuProps) => {
  const [open, setOpen] = useState(args.open);

  return (
    <DeckActionsMenu
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
  title: "Pages/Deck List/DeckActionsMenu",
  component: DeckActionsMenu,
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
    deckName: "Japanese verbs",
    open: false,
    onToggle: fn(),
    onClose: fn(),
    onDownload: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DeckActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const WithStudySession: Story = {
  args: { open: true, onRestart: fn() },
};

export const Disabled: Story = {
  args: { open: true, disabled: true },
};

export const LongDeckName: Story = {
  args: {
    deckName:
      "A very long deck name remains available in every accessible action label without widening the row".repeat(2),
    open: true,
  },
};

export const Interaction: Story = {
  render: (args) => <DeckActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.deckName}` }));
    await expect(canvas.getByRole("menu", { name: `Actions for ${args.deckName}` })).toBeVisible();
    await userEvent.click(canvas.getByRole("menuitem", { name: "Download" }));
    await expect(args.onDownload).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("menu", { name: `Actions for ${args.deckName}` })).not.toBeInTheDocument();
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
