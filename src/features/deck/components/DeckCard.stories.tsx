/**
 * @file Defines Storybook examples for Deck Card.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";
import { DeckCard as Template } from "@/features/deck/components/DeckCard";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Deck/DeckCard",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    deck: fixture.deck.default,
    cardCount: 24,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inactive: Story = {};

export const WithStudyProgress: Story = {
  args: {
    studyProgress: {
      currentIndex: 0,
      cardCount: 3,
      lastStudiedAt: Date.now() - 5 * 60 * 1000,
    },
  },
};

export const Active: Story = WithStudyProgress;

export const TooLongName: Story = {
  args: {
    deck: fixture.deck.tooLongName,
  },
};

export const LongTitle: Story = TooLongName;

export const IphoneX: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
};

export const MobileLight: Story = IphoneX;

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};
