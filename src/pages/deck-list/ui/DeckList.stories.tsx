import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, within } from "storybook/test";

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
  play: async ({ args, canvas, userEvent, step }) => {
    const trigger = canvas.getByRole("button", { name: "Add" });
    await step("STORYBOOK-DECK-LIST-01 Request deck creation", async () => {
      await userEvent.click(trigger);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Create deck" }));
      await expect(args.onCreateDeck).toHaveBeenCalled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });

    await step("STORYBOOK-DECK-LIST-02 Request deck import", async () => {
      await userEvent.click(trigger);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Import decks" }));
      await expect(args.onImportDeck).toHaveBeenCalled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
  },
};

export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-03 Japanese deck list", async () => {
      await expect(canvas.getByRole("heading", { level: 1, name: "デッキ" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "追加" }));
      await expect(canvas.getByRole("menuitem", { name: "デッキを作成" })).toBeVisible();
      await expect(canvas.getByRole("menuitem", { name: "デッキをインポート" })).toBeVisible();
      const [firstDeck] = mixed.studying;
      if (firstDeck == null) throw new Error("Japanese requires at least one Deck");
      const [firstDeckName] = canvas.getAllByText(firstDeck.deck.name);
      if (firstDeckName == null) throw new Error("Japanese requires the first Deck name to be visible");
      await expect(firstDeckName).toBeVisible();
    });
  },
};

export const ViewDeck: Story = {
  args: { deckCard: { onClickView: fn() } },
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-04 View selected deck", async () => {
      const [trigger] = canvas.getAllByRole("button", { name: /^Open actions for / });
      const [firstDeck] = mixed.studying;
      if (trigger == null || firstDeck == null) throw new Error("ViewDeck requires at least one Deck");

      await userEvent.click(trigger);
      await userEvent.click(canvas.getByRole("menuitem", { name: "View" }));

      await expect(args.deckCard?.onClickView).toHaveBeenCalledWith(firstDeck.deck.id);
    });
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
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-05 Empty deck list", async () => {
      await expect(canvas.getByText("0 decks")).toBeVisible();
      await expect(canvas.getByRole("heading", { name: "No decks yet" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Create deck" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Add" }));
      await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeEnabled();
      await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toBeEnabled();
    });
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
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-06 Review counts", async () => {
      await expect(canvas.getByRole("region", { name: "Decks" })).toBeVisible();
      await userEvent.click(canvas.getByText("About counts"));
      await expect(canvas.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
      await expect(canvas.getByText("5 due · 5 new")).toBeVisible();
    });
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

export const ExclusiveMenus: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-10 Keep only the last requested menu open", async () => {
      const triggers = canvas.getAllByRole("button", { name: /^Open actions for / });
      for (const trigger of [triggers[0], triggers[1], canvas.getByRole("button", { name: "Add" }), triggers[0]]) {
        if (!trigger) throw new Error("Two decks are required");
        await userEvent.click(trigger);
        await expect(canvas.getAllByRole("menu")).toHaveLength(1);
        await expect(trigger).toHaveAttribute("aria-expanded", "true");
      }
    });
  },
};

export const KeyboardAddMenu: Story = {
  play: async ({ args, canvas, userEvent, step }) => {
    const add = canvas.getByRole("button", { name: "Add" });
    await step("STORYBOOK-DECK-LIST-11 Navigate and dismiss the add menu", async () => {
      add.focus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toHaveFocus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toHaveFocus();
      await userEvent.keyboard("{Escape}");
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await expect(add).toHaveFocus();
      await expect(args.onCreateDeck).not.toHaveBeenCalled();
      await expect(args.onImportDeck).not.toHaveBeenCalled();
    });
    await step("STORYBOOK-DECK-LIST-12 Restore focus after requesting creation", async () => {
      await userEvent.click(add);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Create deck" }));
      await expect(args.onCreateDeck).toHaveBeenCalledOnce();
      await expect(args.onImportDeck).not.toHaveBeenCalled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await expect(add).toHaveFocus();
    });
  },
};

export const CheckingContract: Story = {
  args: Checking.args ?? {},
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-13 Distinguish checking from confirmed empty", async () => {
      await expect(canvas.getByRole("status")).toHaveTextContent("Checking for sample deck…");
      await expect(canvas.queryByText("No decks yet")).not.toBeInTheDocument();
    });
  },
};

export const BootstrapRecovery: Story = {
  args: BootstrapError.args ?? {},
  play: async ({ args, canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-14 Request recovery actions after bootstrap failure", async () => {
      await expect(canvas.getByRole("alert")).toBeVisible();
      await expect(canvas.getByText("Unable to load sample deck")).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
      await expect(args.empty?.onRetry).toHaveBeenCalledOnce();
      await userEvent.click(canvas.getByRole("button", { name: "Create deck" }));
      await expect(args.onCreateDeck).toHaveBeenCalledOnce();
      await userEvent.click(canvas.getByRole("button", { name: "Import decks" }));
      await expect(args.onImportDeck).toHaveBeenCalledOnce();
    });
  },
};

const activeDeck = { ...fixture.deck.default, id: "active-deck", name: "Active deck" };
const otherDeck = { ...fixture.deck.default, id: "other-deck", name: "Other deck" };
export const OnePendingDeck: Story = {
  args: {
    sections: { studying: [], other: otherItems([activeDeck, otherDeck]) },
    deckCard: { isPending: (id) => id === "active-deck" },
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-21 Disable only the pending deck", async () => {
      for (const [name, pending] of [
        ["Active deck", true],
        ["Other deck", false],
      ] as const) {
        const row = canvas.getByRole("article", { name });
        await expect(row).toHaveAttribute("aria-busy", String(pending));
        for (const button of within(row).getAllByRole("button")) {
          if (pending) await expect(button).toBeDisabled();
          else await expect(button).toBeEnabled();
        }
      }
    });
  },
};
