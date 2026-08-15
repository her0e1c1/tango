import type { Meta, StoryObj } from "@storybook/react";

import { deck } from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { DeckEditForm } from "./DeckEditForm";

const longDeck = {
  ...deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

const meta = {
  title: "Features/Deck Edit/DeckEditForm",
  component: DeckEditForm,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    deck: deck.default,
    onCancel: () => undefined,
    onSaved: () => undefined,
  },
} satisfies Meta<typeof DeckEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongValues: Story = { args: { deck: longDeck } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
