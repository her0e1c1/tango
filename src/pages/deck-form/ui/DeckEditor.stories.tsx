import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import type { DeckFormProps } from "../model/useDeckFormState";
import { DeckEditor } from "./DeckEditor";

const longDeck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

const createForm = (deck: typeof fixture.deck.default): DeckFormProps => ({
  deckInfo: {
    id: deck.id,
    createdAt: new Date(deck.createdAt).toLocaleDateString(),
    updatedAt: new Date(deck.updatedAt).toLocaleDateString(),
  },
  fields: {
    name: { defaultValue: deck.name },
    convertToBr: { checked: deck.convertToBr, onChange: () => undefined },
    localMode: { checked: deck.localMode, disabled: !deck.localMode, onChange: () => undefined },
    url: { defaultValue: deck.url },
    category: { defaultValue: deck.category, options: [{ label: deck.category, value: deck.category }] },
  },
  localModeHelp: deck.localMode
    ? "Turn off to save this deck and its cards to Firestore. This change cannot be undone."
    : "This deck and its cards are saved to Firestore.",
  errors: { name: undefined, url: undefined },
  isSubmitting: false,
  onCancel: () => undefined,
  onSubmit: () => undefined,
});

const meta = {
  title: "Pages/Deck Form/DeckEditor",
  component: DeckEditor,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    deckName: fixture.deck.default.name,
    form: createForm(fixture.deck.default),
  },
} satisfies Meta<typeof DeckEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = {
  args: { form: { ...createForm(fixture.deck.default), isSubmitting: true } },
};
export const ValidationError: Story = {
  args: {
    form: {
      ...createForm(fixture.deck.default),
      errors: { name: "Deck name is required.", url: "Enter a valid URL." },
    },
  },
};
export const SaveError: Story = { args: { saveError: new Error("Deck write failed") } };
export const LongValues: Story = { args: { deckName: longDeck.name, form: createForm(longDeck) } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
