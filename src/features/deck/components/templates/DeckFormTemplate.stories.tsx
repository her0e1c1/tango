import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";
import { DeckFormTemplate as Template } from "@/features/deck/components/templates/DeckFormTemplate";
import type { DeckFormFields } from "@/features/deck/components/DeckForm";
import * as fixture from "@/shared/storybook/fixture";

const fieldsFor = (deck: Deck): DeckFormFields => ({
  name: { value: deck.name, onChange: () => undefined },
  convertToBr: { checked: Boolean(deck.convertToBr), onChange: () => undefined },
  url: { value: deck.url ?? "", onChange: () => undefined },
  isPublic: { checked: deck.isPublic, onChange: () => undefined },
  localMode: { checked: Boolean(deck.localMode), onChange: () => undefined },
  category: {
    value: deck.category,
    options: fixture.form.options.default,
    onChange: () => undefined,
  },
});

const longDeck: Deck = {
  ...fixture.deck.tooLongName,
  url: `https://example.com/${"deeply-nested/".repeat(12)}deck.csv`,
  category: "value 3",
};

const meta = {
  title: "Deck/DeckFormTemplate",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    deckForm: {
      deck: fixture.deck.default,
      fields: fieldsFor(fixture.deck.default),
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongValues: Story = {
  args: { deckForm: { deck: longDeck, fields: fieldsFor(longDeck) } },
};

export const Submitting: Story = {
  args: {
    deckForm: { deck: fixture.deck.default, fields: fieldsFor(fixture.deck.default), isSubmitting: true },
  },
};

export const DarkReview: Story = {
  ...LongValues,
  globals: { theme: "dark" },
};

export const IphoneX: Story = {
  ...LongValues,
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
