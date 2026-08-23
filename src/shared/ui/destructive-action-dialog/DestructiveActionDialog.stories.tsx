import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { DestructiveActionDialog } from "./DestructiveActionDialog";

const meta = {
  title: "Shared/Feedback/DestructiveActionDialog",
  component: DestructiveActionDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Delete deck?",
    targetLabel: "Deck",
    targetName: "Japanese verbs",
    description: (
      <>
        <p>This permanently deletes 24 cards.</p>
        <p>Any in-progress study session for this deck will also end. This action cannot be undone.</p>
      </>
    ),
    confirmLabel: "Delete deck",
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DestructiveActionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Deck: Story = {};

export const Card: Story = {
  args: {
    title: "Delete card?",
    targetLabel: "Card front",
    targetName:
      "A long card front remains available to assistive technology and scrolls instead of overflowing the dialog on small screens.",
    description: <p>This permanently deletes this card. This action cannot be undone.</p>,
    confirmLabel: "Delete card",
  },
};

export const Pending: Story = { args: { pending: true } };

export const Failure: Story = {
  args: { errorMessage: "Unable to delete this deck. Check your connection and try again." },
};

export const Mobile: Story = {
  ...Card,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = { globals: { theme: "dark" } };
