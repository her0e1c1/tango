import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { AiOutlineDelete, AiOutlineDownload, AiOutlineEdit } from "react-icons/ai";
import { expect, fn } from "storybook/test";

import { ActionsMenu, type ActionsMenuProps } from "./ActionsMenu";

const ActionsMenuStory = (args: ActionsMenuProps) => {
  const [open, setOpen] = useState(args.open);

  return (
    <ActionsMenu
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
  title: "Shared/Navigation/ActionsMenu",
  component: ActionsMenu,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  decorators: [
    (StoryComponent) => (
      <div className="flex min-h-20 w-80 items-center justify-end rounded-surface border border-border bg-surface px-3 shadow-surface">
        <StoryComponent />
      </div>
    ),
  ],
  args: {
    groupLabel: "Document actions",
    triggerLabel: "Open document actions",
    menuLabel: "Document actions",
    open: false,
    onToggle: fn(),
    onClose: fn(),
    items: [
      { key: "download", label: "Download", icon: <AiOutlineDownload aria-hidden="true" />, onSelect: fn() },
      { key: "edit", label: "Edit", icon: <AiOutlineEdit aria-hidden="true" />, onSelect: fn() },
      {
        key: "delete",
        label: "Delete",
        icon: <AiOutlineDelete aria-hidden="true" />,
        danger: true,
        onSelect: fn(),
      },
    ],
  },
} satisfies Meta<typeof ActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const Disabled: Story = {
  args: { open: true, disabled: true },
};

export const Interaction: Story = {
  render: (args) => <ActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Open document actions" });
    await userEvent.click(trigger);
    await expect(canvas.getByRole("menu", { name: "Document actions" })).toBeVisible();
    await userEvent.click(canvas.getByRole("menuitem", { name: "Download" }));
    const downloadItem = args.items.find(({ key }) => key === "download");
    await expect(downloadItem?.onSelect).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("menu", { name: "Document actions" })).not.toBeInTheDocument();
  },
};

export const Mobile: Story = {
  args: { open: true },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { open: true },
  globals: { theme: "dark" },
};
