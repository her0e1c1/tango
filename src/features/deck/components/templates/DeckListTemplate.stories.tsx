import type { Meta, StoryObj } from "@storybook/react";

import {
  type DeckListItem,
  type DeckListSections,
  DeckListTemplate as Template,
} from "@/features/deck/components/templates/DeckListTemplate";
import * as fixture from "@/shared/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/shared/storybook/storybookViewports";

const otherItems = (decks: Deck[]): DeckListItem[] => decks.map((deck, index) => ({ deck, cardCount: 12 + index * 4 }));
const studyingItems = (decks: Deck[]): DeckListItem[] =>
  decks.map((deck, index) => ({
    deck,
    cardCount: 30 + index,
    studyProgress: {
      currentIndex: index + 1,
      cardCount: 12 + index * 7,
      lastStudiedAt: Date.now() - index * 24 * 60 * 60 * 1000,
    },
  }));

const mixed: DeckListSections = {
  studying: studyingItems(fixture.decks.default.slice(0, 3)),
  other: otherItems(fixture.decks.default.slice(3)),
};
const longSections: DeckListSections = {
  studying: studyingItems(fixture.decks.long.slice(0, 4)),
  other: otherItems(fixture.decks.long.slice(4)),
};

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
    sections: mixed,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Inactive: Story = {
  args: { sections: { studying: [], other: otherItems(fixture.decks.default) } },
};

export const WithStudyProgress: Story = {
  args: { sections: { studying: studyingItems(fixture.decks.default), other: [] } },
};

export const Active: Story = WithStudyProgress;

export const Empty: Story = {
  args: { sections: { studying: [], other: [] } },
};

export const EmptyComposition: Story = Empty;

export const Long: Story = {
  args: { sections: longSections },
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
  args: { sections: longSections },
};
