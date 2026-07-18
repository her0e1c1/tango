import type { Meta, StoryObj } from "@storybook/react";

import { Card as Template } from "@/features/card/components/Card";
import * as fixture from "@/shared/storybook/fixture";

const meta = {
  title: "Card/Card",
  component: Template,
  tags: ["autodocs"],
  args: {
    card: fixture.card.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unstudied: Story = {
  args: { card: { ...fixture.card.default, numberOfSeen: 0, score: 0 } },
};

export const LongText: Story = { args: { card: fixture.card.long } };
export const LongTags: Story = { args: { card: fixture.card.longTags } };
export const ActionsOpen: Story = { args: { menuOpen: true } };
export const Pending: Story = { args: { disabled: true } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { globals: { theme: "dark" } };
