import type { Deck } from "@/entities/deck";

import type { Meta, StoryObj } from "@storybook/react";
import type { ComponentProps } from "react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { DeckFormView as View } from "./DeckFormView";

type DeckFormFields = NonNullable<ComponentProps<typeof View>["deckForm"]>["fields"];

const fieldsFor = (deck: Deck): DeckFormFields => ({
  name: { value: deck.name, onChange: () => undefined },
  convertToBr: { checked: Boolean(deck.convertToBr), onChange: () => undefined },
  url: { value: deck.url ?? "", onChange: () => undefined },
  category: { value: deck.category, options: fixture.form.options.default, onChange: () => undefined },
});

const longDeck: Deck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

const meta = {
  title: "Pages/Deck Form",
  component: View,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    deckForm: {
      deck: fixture.deck.default,
      fields: fieldsFor(fixture.deck.default),
      onCancel: () => undefined,
    },
  },
} satisfies Meta<typeof View>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongValues: Story = {
  args: { deckForm: { deck: longDeck, fields: fieldsFor(longDeck), onCancel: () => undefined } },
};
export const Submitting: Story = {
  args: {
    deckForm: {
      deck: fixture.deck.default,
      fields: fieldsFor(fixture.deck.default),
      isSubmitting: true,
      onCancel: () => undefined,
    },
  },
};
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
