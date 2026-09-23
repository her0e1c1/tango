import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn } from "storybook/test";

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

export const ListActions: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Add" });
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
    await userEvent.click(canvas.getByRole("button", { name: "追加" }));
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
  args: { deckCard: { onClickView: fn() } },
  play: async ({ args, canvas, userEvent }) => {
    const [trigger] = canvas.getAllByRole("button", { name: /^Open actions for / });
    const [firstDeck] = mixed.studying;
    if (trigger == null || firstDeck == null) throw new Error("ViewDeck requires at least one Deck");

    await userEvent.click(trigger);
    await userEvent.click(canvas.getByRole("menuitem", { name: "View" }));

    await expect(args.deckCard?.onClickView).toHaveBeenCalledWith(firstDeck.deck.id);
  },
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
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByText("0 decks")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "No decks yet" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Create deck" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
    await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
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
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("region", { name: "Decks" })).toBeVisible();
    await userEvent.click(canvas.getByText("About counts"));
    await expect(canvas.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
    await expect(canvas.getByText("5 due · 5 new")).toBeVisible();
  },
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
