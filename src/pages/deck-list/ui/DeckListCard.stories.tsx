import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { DeckListCard, type DeckListCardProps } from "./DeckListCard";
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
export const ContinuePending: Story = {
  args: { ...WithStudyProgress.args, continuingDeckId: fixture.deck.default.id },
};
export const OtherContinuePending: Story = {
  args: { ...WithStudyProgress.args, continuingDeckId: "other-deck" },
};
export const StudyWhileContinuePending: Story = {
  args: { continuingDeckId: "other-deck" },
};

export const DueCards: Story = { args: { review: { due: 12, new: 5, nextDueAt: undefined } } };
export const NewCards: Story = { args: { review: { due: 0, new: 18, nextDueAt: undefined } } };
export const NextReview: Story = { args: { review: { due: 0, new: 0, nextDueAt: fixture.timestamp + 86_400_000 } } };
export const MobileLongName: Story = { ...TooLongName, globals: { viewport: { value: "iphone5", isRotated: false } } };

const namedDeck = { ...fixture.deck.default, id: "deck-id", name: "Deck name" };
const zeroReviewStory = (cardCount: number, nextDueAt?: number): Story => ({
  args: { deck: namedDeck, cardCount, review: { due: 0, new: 0, nextDueAt } },
});
export const NoHeldCards = zeroReviewStory(0);
export const NoMatchingCards = zeroReviewStory(3);
export const FutureReview = zeroReviewStory(3, fixture.timestamp + 86_400_000);

const primaryReviewStory = (due: number): Story => ({
  args: { deck: namedDeck, review: { due, new: 2, nextDueAt: undefined }, onClickStudy: fn() },
});
export const ReviewRequest = primaryReviewStory(1);
export const NewStudyRequest = primaryReviewStory(0);

export const StudyWithoutOpening: Story = {
  args: { deck: namedDeck, onClickStudy: fn(), onClickName: fn() },
};

const InteractiveDeckCard = (args: DeckListCardProps) => {
  const [open, setOpen] = useState<string>();
  return (
    <DeckListCard
      {...args}
      openMenuDeckId={open}
      onToggleMenu={(id) => setOpen(open === id ? undefined : id)}
      onCloseMenu={() => setOpen(undefined)}
    />
  );
};
export const TargetedOperations: Story = {
  args: {
    deck: namedDeck,
    ...WithStudyProgress.args,
    onClickName: fn(),
    onClickView: fn(),
    onClickContinue: fn(),
    onClickRestart: fn(),
    onClickDownload: fn(),
    onClickEdit: fn(),
    onClickDelete: fn(),
    onClickStudy: fn(),
  },
  render: (args) => <InteractiveDeckCard {...args} />,
};

const positionStory = (count: number, total: number, lastStudiedAt: number): Story => ({
  args: {
    deck: namedDeck,
    cardCount: count,
    studySession: {
      sessionId: "session",
      deckId: "deck-id",
      cardOrderIds: Array.from({ length: total }, (_, i) => `card-${i}`),
      currentIndex: 1,
      lastStudiedAt,
      remote: { uid: "uid", startedAt: fixture.timestamp },
    },
  },
});
export const StudyPosition = positionStory(8, 3, fixture.timestamp);
export const UnknownStudyTime = positionStory(2, 2, 0);

export const LocalDeck: Story = {};

export const Tablet: Story = {
  args: { ...TooLongName.args, ...WithStudyProgress.args },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: { ...DueCards.args, openMenuDeckId: fixture.deck.default.id },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: { ...Tablet.args, ...DueCards.args },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const DarkPending: Story = {
  args: { ...TooLongName.args, ...DueCards.args, ...Pending.args },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};
