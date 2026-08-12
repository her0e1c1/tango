/**
 * @file Defines Storybook examples for the Card Form Page view.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Card } from "@/entities/card";

import type { Meta, StoryObj } from "@storybook/react";

import type { Option } from "@/shared/ui/forms";
import type { CardFormFields } from "@/features/card";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { CardFormView as Template } from "./CardFormView";

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
  title: "Pages/Card Form",
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
    cardForm: {
      card: fixture.card.default,
      fields: fieldsFor(fixture.card.default, [...fixture.form.options.default]),
    },
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongValues: Story = {
  args: {
    cardForm: {
      card: longCard,
      fields: fieldsFor(longCard, longTagOptions),
    },
  },
};

export const Submitting: Story = {
  args: {
    cardForm: {
      card: fixture.card.default,
      fields: fieldsFor(fixture.card.default, [...fixture.form.options.default]),
      isSubmitting: true,
    },
  },
};

export const DarkReview: Story = {
  ...LongValues,
  globals: { theme: "dark" },
};

export const IphoneReview: Story = {
  ...LongValues,
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};
