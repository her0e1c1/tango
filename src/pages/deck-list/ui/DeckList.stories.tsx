import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { Layout } from "@/shared/ui/layout";
import type { Deck } from "@/entities/deck";
import * as fixture from "@/storybook/fixture";

import { DeckList, type DeckListProps } from "./DeckList";

const otherItems = (decks: Deck[]) => decks.map((deck, index) => ({ deck, cardCount: 12 + index * 4 }));
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
      remote: { uid: "uid", startedAt: 0 },
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
  component: DeckList,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Layout contentSurface="canvas">
        <Story />
      </Layout>
    ),
  ],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    sections: mixed,
    onCreateDeck: fn(),
    onImportDeck: fn(),
  },
} satisfies Meta<typeof DeckList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ListActions: Story = {};

export const Japanese: Story = {
  parameters: { locale: "ja" },
};

export const ViewDeck: Story = {
  args: { deckCard: { onClickView: fn() } },
};

export const Inactive: Story = {
  args: { sections: { studying: [], other: otherItems(fixture.decks.default) } },
};

export const WithStudyProgress: Story = {
  args: { sections: { studying: studyingItems(fixture.decks.default), other: [] } },
};

export const Empty: Story = {
  args: {
    sections: { studying: [], other: [] },
    empty: {
      reason: "confirmed-empty",
    },
  },
};

export const Checking: Story = {
  args: {
    sections: { studying: [], other: [] },
    empty: {
      reason: "checking",
    },
  },
};

export const BootstrapError: Story = {
  args: {
    sections: { studying: [], other: [] },
    empty: {
      reason: "error",
      onRetry: fn(),
    },
  },
};

export const Long: Story = {
  args: { sections: longSections },
};

export const IphoneX: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};

export const IphoneXLong: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
  args: { sections: longSections },
};

const reviewSections: DeckListProps["sections"] = {
  studying: studyingItems(fixture.decks.default.slice(0, 1)).map((item) => ({
    ...item,
    review: { due: 2, new: 1, nextDueAt: undefined },
  })),
  reviewNow: otherItems(fixture.decks.default.slice(1, 3)).map((item, i) => ({
    ...item,
    review: { due: i === 0 ? 3 : 0, new: 2, nextDueAt: undefined },
  })),
  other: otherItems(fixture.decks.default.slice(3)).map((item) => ({
    ...item,
    review: { due: 0, new: 0, nextDueAt: fixture.timestamp + 86_400_000 },
  })),
  totals: { due: 5, new: 5 },
};
export const ReviewCounts: Story = {
  args: { sections: reviewSections },
};
export const ReviewJapanese: Story = { args: { sections: reviewSections }, parameters: { locale: "ja" } };
export const ReviewMobileDark: Story = {
  args: { sections: reviewSections },
  globals: { theme: "dark", viewport: { value: "iphonex", isRotated: false } },
};
export const ReviewZoom: Story = {
  args: { sections: reviewSections },
  decorators: [
    (Story) => (
      <div style={{ zoom: 2 }}>
        <Story />
      </div>
    ),
  ],
};

export const MobileCards: Story = {
  args: { sections: reviewSections },
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const TabletCards: Story = {
  args: { sections: reviewSections },
  globals: { viewport: { value: "ipad", isRotated: false } },
};

export const ExclusiveMenus: Story = {};

export const KeyboardAddMenu: Story = {};

export const CheckingContract: Story = {
  args: Checking.args ?? {},
};

export const BootstrapRecovery: Story = {
  args: BootstrapError.args ?? {},
};

const activeDeck = { ...fixture.deck.default, id: "active-deck", name: "Active deck" };
const otherDeck = { ...fixture.deck.default, id: "other-deck", name: "Other deck" };
export const OnePendingDeck: Story = {
  args: {
    sections: { studying: [], other: otherItems([activeDeck, otherDeck]) },
    deckCard: { isPending: (id) => id === "active-deck" },
  },
};

export const Desktop: Story = {
  args: {
    sections: {
      ...reviewSections,
      studying: reviewSections.studying.map((item) => ({
        ...item,
        deck: { ...item.deck, name: fixture.deck.tooLongName.name },
      })),
      reviewNow:
        reviewSections.reviewNow?.map((item) => ({
          ...item,
          deck: { ...item.deck, name: fixture.deck.tooLongName.name },
        })) ?? [],
    },
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Desktop,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const MobileDarkError: Story = {
  ...BootstrapError,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
