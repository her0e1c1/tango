/**
 * @file Defines Storybook examples for Card.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { Card as Template } from "./Card";
import * as fixture from "@/storybook/fixture";
import { createStudyProgress } from "@/test/factories";

const meta = {
  title: "Features/Card List/Card",
  component: Template,
  tags: ["autodocs"],
  args: {
    card: fixture.card.default,
    progress: createStudyProgress({ cardId: fixture.card.default.id, score: 3, numberOfSeen: 5 }),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Unstudied: Story = {
  args: { progress: createStudyProgress({ cardId: fixture.card.default.id }) },
};

export const LongText: Story = { args: { card: fixture.card.long } };
export const LongTags: Story = { args: { card: fixture.card.longTags } };
export const ActionsOpen: Story = { args: { menuOpen: true } };
export const Pending: Story = { args: { disabled: true } };
export const Mobile: Story = { parameters: { viewport: { defaultViewport: "iphonex" } } };
export const Dark: Story = { globals: { theme: "dark" } };
