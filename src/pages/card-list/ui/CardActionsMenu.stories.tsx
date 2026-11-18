import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

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
};

export const Mobile: Story = {
  ...Open,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...Open,
  globals: { theme: "dark" },
};

export const DeleteRequest: Story = {
  args: { cardText: "Binary search" },
  render: (args) => <CardActionsMenuStory {...args} />,
};

export const DisabledMenuContract: Story = {
  args: { open: true, disabled: true },
};

export const Tablet: Story = {
  ...LongCardText,
  render: (args) => <CardActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Open,
  render: (args) => <CardActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
