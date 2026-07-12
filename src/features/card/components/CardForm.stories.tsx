import type { Meta, StoryObj } from "@storybook/react";

import { CardForm as Template, type CardFormFields } from "@src/features/card/components/CardForm";
import * as fixture from "@src/shared/storybook/fixture";

const fieldsFor = (card: Card, options: Option[]): CardFormFields => ({
  frontText: { value: card.frontText, onChange: () => undefined },
  backText: { value: card.backText, onChange: () => undefined },
  tags: options.map(({ label, value }) => ({
    label,
    value,
    input: { name: "tags", value, checked: card.tags.includes(value), onChange: () => undefined },
  })),
});

const meta = {
  title: "Card/CardForm",
  component: Template,
  tags: ["autodocs"],
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
