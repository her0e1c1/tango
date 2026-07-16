import type { Meta, StoryObj } from "@storybook/react";

import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";
import { DeckListTemplate as Template } from "@/features/deck/components/templates/DeckListTemplate";
import * as fixture from "@/shared/storybook/fixture";

const meta = {
  title: "Deck/DeckListTemplate",
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
    decks: fixture.decks.default,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inactive: Story = {};

export const WithStudyProgress: Story = {
  args: {
    studyProgress: {
      deckId: "deck-1",
      currentIndex: 0,
      cardCount: 3,
    },
  },
};

export const Active: Story = WithStudyProgress;

export const Empty: Story = {
  args: {
    decks: [],
  },
};

export const EmptyComposition: Story = Empty;

export const Long: Story = {
  args: {
    decks: fixture.decks.long,
  },
};

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

export const IphoneXLong: Story = {
  parameters: {
    viewport: {
      defaultViewport: "iphonex",
    },
  },
  args: {
    decks: fixture.decks.long,
  },
};
