/**
 * @file Defines Storybook examples for Card Form.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { CardForm as Template, type CardFormFields } from "@/features/card/components/CardForm";
import type { Option } from "@/components/forms/Select";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

/**
 * Prepares fields for data for the Storybook examples in this file.
 * The helper keeps sample setup separate from the component configuration readers are meant to
 * inspect.
 */
const fieldsFor = (card: Card, options: Option[]): CardFormFields => ({
  frontText: { value: card.frontText, onChange: () => undefined },
  backText: { value: card.backText, onChange: () => undefined },
  tags: options.map(({ label, value }) => ({
    label,
    value,
    input: { name: "tags", value, checked: card.tags.includes(value), onChange: () => undefined },
  })),
});

const longCard: Card = {
  ...fixture.card.long,
  tags: [...fixture.tags.toolong],
};
const longTagOptions = fixture.tags.toolong.map((tag) => ({ label: tag, value: tag }));

const meta = {
  title: "Card/CardForm",
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
    card: fixture.card.default,
    fields: fieldsFor(fixture.card.default, [...fixture.form.options.default]),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TooManyOptions: Story = {
  args: {
    card: fixture.card.default,
    fields: fieldsFor(fixture.card.default, fixture.form.options.toomany),
  },
};

export const LongValues: Story = {
  args: {
    card: longCard,
    fields: fieldsFor(longCard, longTagOptions),
  },
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
