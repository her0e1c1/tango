import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { DeckDeletionDialog } from "./DeckDeletionDialog";

const meta = {
  title: "Features/Deck Deletion/DeckDeletionDialog",
  component: DeckDeletionDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    target: {
      deckName: "Japanese verbs",
      cardCount: 24,
    },
    pending: false,
    onCancel: fn(),
    onConfirm: fn(async () => undefined),
  },
} satisfies Meta<typeof DeckDeletionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const SingleCard: Story = {
  args: {
    target: {
      deckName: "Quick reminder",
      cardCount: 1,
    },
  },
};

export const LongDeckName: Story = {
  args: {
    target: {
      deckName:
        "A very long deck name that remains readable without pushing the dialog actions outside the viewport ".repeat(
          3
        ),
      cardCount: 128,
    },
  },
};

export const Confirm: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Delete deck" }));
    await expect(args.onConfirm).toHaveBeenCalledOnce();
  },
};

export const Pending: Story = { args: { pending: true } };

export const Mobile: Story = {
  ...LongDeckName,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...LongDeckName,
  globals: { theme: "dark" },
};
