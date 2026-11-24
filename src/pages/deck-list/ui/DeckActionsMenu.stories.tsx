import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { DeckActionsMenu, type DeckActionsMenuProps } from "./DeckActionsMenu";

const DeckActionsMenuStory = (args: DeckActionsMenuProps) => {
  const [open, setOpen] = useState(args.open);
  if (args.disabled && open) setOpen(false);

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
    onHistory: fn(),
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
};

export const Mobile: Story = {
  ...Open,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...Open,
  globals: { theme: "dark" },
};

export const History: Story = {
  render: (args) => <DeckActionsMenuStory {...args} />,
};

export const UnstartedMenu: Story = {
  args: { open: true },
};

export const KeyboardMenu: Story = {
  args: { onRestart: fn() },
  render: (args) => <DeckActionsMenuStory {...args} />,
};

export const OutsideFocus: Story = {
  render: (args) => (
    <>
      <button type="button">Outside menu</button>
      <DeckActionsMenuStory {...args} />
    </>
  ),
};

function refocusStory(): Story {
  return {
    render: (args) => <DeckActionsMenuStory {...args} />,
  };
}
export const RefocusDownload = refocusStory();
export const RefocusEdit = refocusStory();
export const RefocusDelete = refocusStory();

function PendingMenuExample(args: DeckActionsMenuProps) {
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setDisabled(!disabled)}>
        Toggle pending
      </button>
      <DeckActionsMenuStory {...args} disabled={disabled} />
    </>
  );
}
export const PendingCycle: Story = {
  render: (args) => <PendingMenuExample {...args} />,
};

export const Tablet: Story = {
  args: { ...LongDeckName.args, onRestart: fn() },
  render: (args) => <DeckActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Open,
  render: (args) => <DeckActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...Tablet,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
