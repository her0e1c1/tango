import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn } from "storybook/test";

import { DeckDeletionDialog } from "./DeckDeletionDialog";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FORM-04 Confirm deletion", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Delete deck" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onConfirm).toHaveBeenCalledOnce();
    });
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

export const Tablet: Story = {
  ...LongDeckName,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongDeckName,
  args: { ...LongDeckName.args, pending: false },
  argTypes: { pending: { control: "boolean" } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...LongDeckName,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};
