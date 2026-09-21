import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";
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
  decorators: [withPageLayout],
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

export const ListActions: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Actions" });
    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole("menuitem", { name: "Create deck" }));
    await expect(args.onCreateDeck).toHaveBeenCalled();
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();

    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole("menuitem", { name: "Import decks" }));
    await expect(args.onImportDeck).toHaveBeenCalled();
    await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
  },
};

export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("heading", { level: 1, name: "デッキ" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "アクション" }));
    await expect(canvas.getByRole("menuitem", { name: "デッキを作成" })).toBeVisible();
    await expect(canvas.getByRole("menuitem", { name: "デッキをインポート" })).toBeVisible();
    const [firstDeck] = mixed.studying;
    if (firstDeck == null) throw new Error("Japanese requires at least one Deck");
    const [firstDeckName] = canvas.getAllByText(firstDeck.deck.name);
    if (firstDeckName == null) throw new Error("Japanese requires the first Deck name to be visible");
    await expect(firstDeckName).toBeVisible();
  },
};

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
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText("0 decks")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Actions" }));
    await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
    await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
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
  studying: studyingItems([{ ...fixture.deck.default, id: "active", name: "Active deck" }]).map((item) => ({
    ...item,
    review: { dueCardCount: 0, newCardCount: 0, nextDueAt: fixture.timestamp + 86_400_000 },
  })),
  reviewNow: [
    {
      deck: { ...fixture.deck.tooLongName, id: "due" },
      cardCount: 24,
      review: { dueCardCount: 12, newCardCount: 4, nextDueAt: undefined },
    },
    {
      deck: { ...fixture.deck.default, id: "new", name: "New deck" },
      cardCount: 2,
      review: { dueCardCount: 0, newCardCount: 2, nextDueAt: undefined },
    },
  ],
  other: [
    {
      deck: { ...fixture.deck.default, id: "future", name: "Future deck" },
      cardCount: 8,
      review: { dueCardCount: 0, newCardCount: 0, nextDueAt: fixture.timestamp + 86_400_000 },
    },
  ],
  reviewSummary: { dueCardCount: 12, newCardCount: 6 },
};

export const ReviewCounts: Story = {
  args: { sections: reviewSections, deckCard: { onClickStudy: fn(), onClickContinue: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    await expect(canvas.getByRole("region", { name: "Review summary" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Study new cards in New deck" }));
    await expect(args.deckCard?.onClickStudy).toHaveBeenCalledWith("new");
    await userEvent.click(canvas.getByRole("button", { name: "Continue Active deck" }));
    await expect(args.deckCard?.onClickContinue).toHaveBeenCalledWith("active");
  },
};

export const ReviewJapanese: Story = {
  args: { sections: reviewSections },
  parameters: { locale: "ja" },
};

export const ReviewMobile: Story = {
  args: { sections: reviewSections },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const ReviewDark: Story = {
  args: { sections: reviewSections },
  globals: { theme: "dark" },
};

export const ReviewZoom: Story = {
  args: { sections: reviewSections },
  render: (args) => (
    <div style={{ zoom: 2 }}>
      <DeckList {...args} />
    </div>
  ),
};
