import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { DestructiveActionDialog as Template } from "@/components/feedback/DestructiveActionDialog";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

const meta = {
  title: "Shared/Feedback/DestructiveActionDialog",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
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
} satisfies Meta<typeof Template>;

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
  parameters: { viewport: { defaultViewport: "iphonex" } },
};

export const Dark: Story = { globals: { theme: "dark" } };
