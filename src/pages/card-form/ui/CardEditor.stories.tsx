import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import type { CardFormProps } from "../model/useCardFormState";
import { CardEditor } from "./CardEditor";

const longCard = {
  ...fixture.card.long,
  tags: [...fixture.tags.toolong],
};

const createForm = (card: typeof fixture.card.default): CardFormProps => ({
  cardInfo: {
    id: card.id,
    uniqueKey: card.uniqueKey,
    createdAt: new Date(card.createdAt).toLocaleDateString(),
  },
  fields: {
    frontText: { defaultValue: card.frontText },
    backText: { defaultValue: card.backText },
    tags: card.tags.map((tag) => ({ label: tag, value: tag, input: { checked: true } })),
  },
  errors: { frontText: undefined, backText: undefined },
  isSubmitting: false,
  onCancel: () => undefined,
  onSubmit: () => undefined,
});

const meta = {
  title: "Pages/Card Form/CardEditor",
  component: CardEditor,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    form: createForm(fixture.card.default),
  },
} satisfies Meta<typeof CardEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Saving: Story = {
  args: { form: { ...createForm(fixture.card.default), isSubmitting: true } },
};
export const ValidationError: Story = {
  args: {
    form: {
      ...createForm(fixture.card.default),
      errors: { frontText: "Front text is required.", backText: "Back text is required." },
    },
  },
};
export const SaveError: Story = { args: { saveError: new Error("Card write failed") } };
export const LongValues: Story = { args: { form: createForm(longCard) } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
