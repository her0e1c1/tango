/**
 * @file Defines Storybook examples for the Deck List presentation.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import type { Deck } from "@/entities/deck";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { DeckList as Template, type DeckListProps } from "./DeckList";

/**
 * Prepares other items data for the Storybook examples in this file.
 * The helper keeps sample setup separate from the component configuration readers are meant to
 * inspect.
 */
const otherItems = (decks: Deck[]) => decks.map((deck, index) => ({ deck, cardCount: 12 + index * 4 }));
/**
 * Prepares studying items data for the Storybook examples in this file.
 * The helper keeps sample setup separate from the component configuration readers are meant to
 * inspect.
 */
const studyingItems = (decks: Deck[]) =>
  decks.map((deck, index) => ({
    deck,
    cardCount: 30 + index,
    studySession: {
      sessionId: `session-${deck.id}`,
      deckId: deck.id,
      cardOrderIds: Array.from({ length: 12 + index * 7 }, (_, cardIndex) => `${deck.id}-card-${String(cardIndex)}`),
      currentIndex: index + 1,
      lastStudiedAt: fixture.timestamp - index * 24 * 60 * 60 * 1000,
    },
  }));

const mixed = {
  studying: studyingItems(fixture.decks.default.slice(0, 3)),
  other: otherItems(fixture.decks.default.slice(3)),
} satisfies DeckListProps["sections"];
const longSections = {
  studying: studyingItems(fixture.decks.long.slice(0, 4)),
  other: otherItems(fixture.decks.long.slice(4)),
} satisfies DeckListProps["sections"];

const meta = {
  title: "Pages/Deck List/DeckList",
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
    onCreateDeck: fn(),
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ViewDeck: Story = {
  args: { deckCard: { onClickName: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    const [viewButton] = canvas.getAllByRole("button", { name: /^View / });
    const [firstDeck] = mixed.studying;
    if (viewButton == null || firstDeck == null) throw new Error("ViewDeck requires at least one Deck");

    await userEvent.click(viewButton);

    await expect(args.deckCard?.onClickName).toHaveBeenCalledWith(firstDeck.deck.id);
  },
};

export const Inactive: Story = {
  args: { sections: { studying: [], other: otherItems(fixture.decks.default) } },
};

export const WithStudyProgress: Story = {
  args: { sections: { studying: studyingItems(fixture.decks.default), other: [] } },
};

export const Empty: Story = {
  args: { sections: { studying: [], other: [] } },
};

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
