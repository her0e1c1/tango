import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@src/shared/storybook/storybookViewports";
import { DeckFormTemplate as Template } from "@src/features/deck/components/templates/DeckFormTemplate";
import type { DeckFormFields } from "@src/features/deck/components/DeckForm";
import * as fixture from "@src/shared/storybook/fixture";

const fields: DeckFormFields = {
  name: { defaultValue: fixture.deck.default.name },
  convertToBr: { checked: Boolean(fixture.deck.default.convertToBr), onChange: () => undefined },
  url: { defaultValue: fixture.deck.default.url },
  isPublic: { checked: fixture.deck.default.isPublic, onChange: () => undefined },
  localMode: { checked: Boolean(fixture.deck.default.localMode), onChange: () => undefined },
  category: {
    value: fixture.deck.default.category,
    options: fixture.form.options.default,
    onChange: () => undefined,
  },
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
      fields,
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
