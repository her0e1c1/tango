import type { Meta, StoryObj } from "@storybook/react";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import { DeckListCard } from "./DeckListCard";
import * as fixture from "@/storybook/fixture";

const meta = {
  title: "Pages/Deck List/DeckListCard",
  component: DeckListCard,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <div className="rounded-surface border border-border bg-surface shadow-surface dark:border-black">
      <DeckListCard {...args} />
    </div>
  ),
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

export const ReviewDue: Story = {
  args: { review: { dueCardCount: 12, newCardCount: 4, nextDueAt: undefined } },
};

export const StudyNew: Story = {
  args: { review: { dueCardCount: 0, newCardCount: 24, nextDueAt: undefined } },
};

export const FutureOnly: Story = {
  args: { review: { dueCardCount: 0, newCardCount: 0, nextDueAt: fixture.timestamp + 86_400_000 } },
};

export const NoMatchingCards: Story = {
  args: { review: { dueCardCount: 0, newCardCount: 0, nextDueAt: undefined } },
};

export const NoCards: Story = {
  args: { cardCount: 0, review: { dueCardCount: 0, newCardCount: 0, nextDueAt: undefined } },
};

export const ContinueWithoutDueCards: Story = {
  args: { ...WithStudyProgress.args, ...FutureOnly.args },
};
