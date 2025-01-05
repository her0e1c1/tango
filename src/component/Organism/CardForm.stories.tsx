import type { Meta, StoryObj } from "@storybook/react";

import { CardForm as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/CardForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    card: fixture.card.default,
    categoryOptions: fixture.form.options.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TooManyOptions: Story = {
  args: {
    card: fixture.card.default,
    categoryOptions: fixture.form.options.toomany,
  },
};
