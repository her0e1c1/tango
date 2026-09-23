import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

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
export const DueCards: Story = { args: { review: { due: 12, new: 5, nextDueAt: undefined } } };
export const NewCards: Story = { args: { review: { due: 0, new: 18, nextDueAt: undefined } } };
export const NextReview: Story = { args: { review: { due: 0, new: 0, nextDueAt: fixture.timestamp + 86_400_000 } } };
export const MobileLongName: Story = { ...TooLongName, globals: { viewport: { value: "iphone5", isRotated: false } } };

const namedDeck = { ...fixture.deck.default, id: "deck-id", name: "Deck name" };
const zeroReviewStory = (cardCount: number, nextDueAt?: number): Story => ({
  args: { deck: namedDeck, cardCount, review: { due: 0, new: 0, nextDueAt } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-15 Explain why no cards are due", async () => {
      const explanation =
        cardCount === 0
          ? "No cards held on this device"
          : nextDueAt === undefined
            ? "No cards match saved filters"
            : `Next review: ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(nextDueAt)}`;
      await expect(canvas.getByText(explanation)).not.toBeVisible();
      await userEvent.click(canvas.getByText("No due or new cards"));
      await expect(canvas.getByText(explanation)).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Deck name" })).toBeEnabled();
    });
  },
});
export const NoHeldCards = zeroReviewStory(0);
export const NoMatchingCards = zeroReviewStory(3);
export const FutureReview = zeroReviewStory(3, fixture.timestamp + 86_400_000);

const primaryReviewStory = (due: number): Story => ({
  args: { deck: namedDeck, review: { due, new: 2, nextDueAt: undefined }, onClickStudy: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-16 Distinguish review from new-card study", async () => {
      await userEvent.click(
        canvas.getByRole("button", { name: due ? "Review Deck name" : "Study new cards in Deck name" })
      );
      await expect(args.onClickStudy).toHaveBeenCalledWith("deck-id");
    });
  },
});
export const ReviewRequest = primaryReviewStory(1);
export const NewStudyRequest = primaryReviewStory(0);

export const StudyWithoutOpening: Story = {
  args: { deck: namedDeck, onClickStudy: fn(), onClickName: fn() },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-18 Request study without opening the row", async () => {
      await expect(canvas.getByText("24 cards")).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Study Deck name" }));
      await expect(args.onClickStudy).toHaveBeenCalledWith("deck-id");
      await expect(args.onClickName).not.toHaveBeenCalled();
    });
  },
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
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-19 Pass the target deck to every operation", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Open cards in Deck name" }));
      await expect(args.onClickName).toHaveBeenCalledWith("deck-id");
      await userEvent.click(canvas.getByRole("button", { name: "Continue Deck name" }));
      await expect(args.onClickContinue).toHaveBeenCalledWith("deck-id");
      await expect(canvas.queryByRole("button", { name: "View" })).not.toBeInTheDocument();
      for (const [name, callback] of [
        ["View", args.onClickView],
        ["Restart", args.onClickRestart],
        ["Download", args.onClickDownload],
        ["Edit", args.onClickEdit],
        ["Delete", args.onClickDelete],
      ] as const) {
        await userEvent.click(canvas.getByRole("button", { name: "Open actions for Deck name" }));
        await userEvent.click(canvas.getByRole("menuitem", { name }));
        await expect(callback).toHaveBeenCalledWith("deck-id");
      }
      await expect(args.onClickStudy).not.toHaveBeenCalled();
    });
  },
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
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-17 Describe the current study position without inventing a timestamp", async () => {
      await expect(canvas.getByText(`${count} cards`)).toBeVisible();
      await expect(canvas.getByText(`Studying · Card 2 of ${total}`)).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Open cards in Deck name" })).toHaveAccessibleDescription(
        `${count} cards Studying · Card 2 of ${total}`
      );
      await expect(canvas.getByRole("button", { name: "Continue Deck name" })).toBeVisible();
      await expect(canvas.queryByRole("progressbar")).not.toBeInTheDocument();
      await expect(canvas.queryByText(namedDeck.category, { exact: true })).not.toBeInTheDocument();
      await expect(canvas.queryByText(/Last studied|Last review/)).not.toBeInTheDocument();
    });
  },
});
export const StudyPosition = positionStory(8, 3, fixture.timestamp);
export const UnknownStudyTime = positionStory(2, 2, 0);

export const LocalDeck: Story = {
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-20 Omit remote indicators for local decks", async () => {
      await expect(canvas.queryByLabelText("Remote deck")).not.toBeInTheDocument();
      await expect(canvas.queryByTitle("Remote deck")).not.toBeInTheDocument();
    });
  },
};
