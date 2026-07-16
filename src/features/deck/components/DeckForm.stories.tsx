import type { Meta, StoryObj } from "@storybook/react";

import { DeckForm as Template, type DeckFormFields } from "@/features/deck/components/DeckForm";
import * as fixture from "@/shared/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";

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
  title: "Deck/DeckForm",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    deck: fixture.deck.default,
    fields: fieldsFor(fixture.deck.default),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongValues: Story = {
  args: { deck: longDeck, fields: fieldsFor(longDeck) },
};

export const Submitting: Story = {
  args: { isSubmitting: true },
};

export const DarkReview: Story = {
  ...LongValues,
  globals: { theme: "dark" },
};

export const IphoneReview: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
