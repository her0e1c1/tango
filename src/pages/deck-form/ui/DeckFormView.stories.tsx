/**
 * @file Defines Storybook examples for the Deck Form Page view.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */
import type { Deck } from "@/entities/deck";

import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/app/storybook/storybookViewports";
import type { DeckFormFields } from "@/features/deck";
import * as fixture from "@/app/storybook/fixture";

import { DeckFormView as Template } from "./DeckFormView";

/**
 * Prepares fields for data for the Storybook examples in this file.
 * The helper keeps sample setup separate from the component configuration readers are meant to
 * inspect.
 */
const fieldsFor = (deck: Deck): DeckFormFields => ({
  name: { value: deck.name, onChange: () => undefined },
  convertToBr: { checked: Boolean(deck.convertToBr), onChange: () => undefined },
  url: { value: deck.url ?? "", onChange: () => undefined },
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
  title: "Pages/Deck Form",
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
      onCancel: () => undefined,
    },
  },
} satisfies Meta<typeof Template>;

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
