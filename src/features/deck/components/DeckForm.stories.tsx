import type { Meta, StoryObj } from "@storybook/react";

import { DeckForm as Template, type DeckFormFields } from "@src/features/deck/components/DeckForm";
import * as fixture from "@src/shared/storybook/fixture";

const fields: DeckFormFields = {
  name: { defaultValue: fixture.deck.default.name },
  convertToBr: { checked: Boolean(fixture.deck.default.convertToBr), onChange: () => undefined },
  url: { ...(fixture.deck.default.url !== undefined ? { defaultValue: fixture.deck.default.url } : {}) },
  isPublic: { checked: fixture.deck.default.isPublic, onChange: () => undefined },
  localMode: { checked: Boolean(fixture.deck.default.localMode), onChange: () => undefined },
  category: {
    value: fixture.deck.default.category,
    options: fixture.form.options.default,
    onChange: () => undefined,
  },
};

const meta = {
  title: "Deck/DeckForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    deck: fixture.deck.default,
    fields,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
