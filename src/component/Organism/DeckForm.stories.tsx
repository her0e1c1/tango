import type { Meta, StoryObj } from "@storybook/react";

import { DeckForm as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/DeckForm",
  component: Template,
  tags: ["autodocs"],
  argTypes: {
    onSubmit: { action: "onSubmit" },
  },
  args: {
    deck: fixture.deck.default,
    categoryOptions: fixture.form.options.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
