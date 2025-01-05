import type { Meta, StoryObj } from "@storybook/react";

import { Card as Template } from "./";
import * as fixture from "../fixture";

const meta = {
  title: "Organism/Card",
  component: Template,
  tags: ["autodocs"],
  args: {
    card: fixture.card.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongText: Story = {
  args: {
    card: fixture.card.long,
  },
};
