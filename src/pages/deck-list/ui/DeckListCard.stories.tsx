import type { Meta, StoryObj } from "@storybook/react-vite";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { DeckListCard } from "./DeckListCard";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Pages/Deck List/DeckListCard",
  component: DeckListCard,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  args: {
    deck: fixture.deck.default,
    cardCount: 24,
  },
} satisfies Meta<typeof DeckListCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithStudyProgress: Story = {
  args: {
    studySession: {
      sessionId: "study-session",
      deckId: fixture.deck.default.id,
      cardOrderIds: ["card-1", "card-2", "card-3"],
      currentIndex: 0,
      lastStudiedAt: fixture.timestamp - 5 * 60 * 1000,
      remote: { uid: "uid", startedAt: 0 },
    },
  },
};

export const TooLongName: Story = {
  args: {
    deck: fixture.deck.tooLongName,
  },
};

export const RestoredFromAnotherDevice: Story = {
  args: {
    studySession: {
      sessionId: "restored-session",
      deckId: fixture.deck.default.id,
      cardOrderIds: ["card-1", "card-2"],
      currentIndex: 1,
      lastStudiedAt: 0,
      remote: { uid: "uid", startedAt: 0 },
    },
  },
};

export const IphoneX: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: {
    theme: "dark",
  },
};

export const Pending: Story = { args: { isPending: () => true } };
export const DueCards: Story = { args: { review: { due: 12, new: 5, nextDueAt: undefined } } };
export const NewCards: Story = { args: { review: { due: 0, new: 18, nextDueAt: undefined } } };
export const NextReview: Story = { args: { review: { due: 0, new: 0, nextDueAt: fixture.timestamp + 86_400_000 } } };
export const MobileLongName: Story = { ...TooLongName, globals: { viewport: { value: "iphone5", isRotated: false } } };
