import type { Meta, StoryObj } from "@storybook/react";

import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import type { CardFormProps } from "../model/useCardFormState";
import { CardEditForm } from "./CardEditForm";

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
  title: "Features/Card Edit/CardEditForm",
  component: CardEditForm,
  tags: ["autodocs"],
  parameters: {
    viewport: { viewports: INITIAL_VIEWPORTS, defaultViewport: "desktop" },
  },
  args: {
    form: createForm(fixture.card.default),
  },
} satisfies Meta<typeof CardEditForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongValues: Story = { args: { form: createForm(longCard) } };
export const Dark: Story = { ...LongValues, globals: { theme: "dark" } };
export const Mobile: Story = {
  ...LongValues,
  parameters: { viewport: { defaultViewport: "iphonex" } },
};
