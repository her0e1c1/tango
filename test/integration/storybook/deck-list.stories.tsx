import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, mocked, screen, waitFor, within } from "storybook/test";
import { downloadTextFile } from "@/shared/files";
import { calculateFsrsState } from "@/entities/card";
import { createDeck, deleteDeck } from "@/entities/deck";
import { routeMeta, state, deck, otherDeck, cards, now, session, prepareWith } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Deck list",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/" } },
};
export default meta;
type Story = StoryObj<typeof meta>;
const reviewCards = cards.map((card, index) =>
  index < 2 ? { ...card, fsrs: { ...calculateFsrsState(null, "good", now - 86_400_000), dueAt: now - 1 } } : card
);
const reviewPage = {
  ...state,
  cards: [...reviewCards, state.cards[5]!],
  preferences: { ...state.preferences, study: { ...state.preferences.study, useCardInterval: true } },
  path: "/",
};

export const AddAndReturn: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const add = await canvas.findByRole("button", { name: "Add" });
    await step("STORYBOOK-DECK-LIST-11 Open and close the Add menu with the keyboard", async () => {
      add.focus();
      await userEvent.keyboard("{Enter}");
      await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeVisible();
      await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await expect(add).toHaveFocus();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-DECK-LIST-01 Open deck creation through its route", async () => {
      await userEvent.click(add);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Create deck" }));
      await expect(await canvas.findByRole("heading", { name: "Create deck" })).toBeVisible();
      await expect(canvas.getByRole("textbox", { name: "Name" })).toBeVisible();
    });
    await step("STORYBOOK-DECK-LIST-12 Return to a closed, usable Add menu", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "tango" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Add" }));
      await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeVisible();
    });
    await step("STORYBOOK-DECK-LIST-02 Open import through the Add menu", async () => {
      await userEvent.click(canvas.getByRole("menuitem", { name: "Import decks" }));
      await expect(await canvas.findByRole("heading", { name: "Add a deck" })).toBeVisible();
      await expect(canvas.getByLabelText("Upload a csv file")).toBeEnabled();
    });
  },
};
export const Japanese: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-03 Translate fixed labels while preserving the deck name", async () => {
      await expect(await canvas.findByRole("heading", { name: "デッキ" })).toBeVisible();
      await expect(canvas.getByRole("article", { name: deck.name })).toHaveTextContent(deck.name);
      await expect(canvas.getByRole("button", { name: `${deck.name}を学習` })).toBeVisible();
    });
  },
};
export const Empty: Story = {
  parameters: { page: { ...state, decks: [], cards: [], path: "/" } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-05 Keep creation and import available after an empty result", async () => {
      await expect(await canvas.findByRole("heading", { name: "No decks yet" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Create deck" })).toBeEnabled();
      await expect(canvas.getAllByRole("button", { name: "Import decks" }).at(-1)).toBeEnabled();
      await userEvent.click(canvas.getByRole("button", { name: "Add" }));
      await expect(canvas.getByRole("menuitem", { name: "Create deck" })).toBeVisible();
      await expect(canvas.getByRole("menuitem", { name: "Import decks" })).toBeVisible();
    });
  },
};
export const Checking: Story = {
  parameters: {
    page: { ...state, decks: [], cards: [], preferences: { ...state.preferences, loadSample: true }, path: "/" },
  },
  beforeEach: prepareWith(() => {
    mocked(createDeck).mockReturnValue(new Promise(() => undefined));
  }),
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-13 Keep pending bootstrap distinct from an empty result", async () => {
      await expect(await canvas.findByText("Checking for sample deck…")).toBeVisible();
      await expect(canvas.queryByRole("heading", { name: "No decks yet" })).not.toBeInTheDocument();
    });
  },
};
export const BootstrapRetry: Story = {
  parameters: Checking.parameters!,
  beforeEach: prepareWith(() => {
    mocked(createDeck).mockRejectedValueOnce(new Error("Network unavailable"));
  }),
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-14 Retry failed sample bootstrap and operate the loaded deck", async () => {
      await expect(await canvas.findByRole("heading", { name: "Unable to load sample deck" })).toBeVisible();
      await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
      await expect(await canvas.findByRole("button", { name: "Study Sample Deck" })).toBeEnabled();
      await expect(canvas.queryByRole("heading", { name: "Unable to load sample deck" })).not.toBeInTheDocument();
      await userEvent.click(canvas.getByRole("button", { name: "Study Sample Deck" }));
      await expect(await canvas.findByRole("heading", { name: "Sample Deck" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: /Start .* cards/ })).toBeEnabled();
    });
  },
};
export const ReviewCounts: Story = {
  parameters: { page: reviewPage },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-06 Explain due and new counts using the current deck data", async () => {
      const row = await canvas.findByRole("article", { name: deck.name });
      await expect(within(row).getByText("2 due · 3 new")).toBeVisible();
      await userEvent.click(canvas.getByText("About counts"));
      await expect(canvas.getByText("Counts use data currently held on this device and saved filters.")).toBeVisible();
    });
  },
};
function studyStory(target: typeof deck, review: boolean): Story {
  return {
    parameters: { page: reviewPage },
    play: async ({ canvas, userEvent, step }) => {
      await step(
        "STORYBOOK-DECK-LIST-16 STORYBOOK-DECK-LIST-18 STORYBOOK-DECK-LIST-19 Open the selected deck's study setup with its primary study kind",
        async () => {
          await userEvent.click(
            await canvas.findByRole("button", {
              name: review ? `Review ${target.name}` : `Study new cards in ${target.name}`,
            })
          );
          await expect(await canvas.findByRole("heading", { name: target.name })).toBeVisible();
          await expect(canvas.getByRole("button", { name: review ? "Start 5 cards" : "Start 1 card" })).toBeEnabled();
          await expect(canvas.queryByRole("slider", { name: "Viewing progress" })).not.toBeInTheDocument();
          await expect(canvas.queryByRole("button", { name: "Card front" })).not.toBeInTheDocument();
        }
      );
    },
  };
}
export const Review = studyStory(deck, true);
export const StudyNew = studyStory(otherDeck, false);
export const ZeroReviewReasons: Story = {
  parameters: {
    page: {
      ...reviewPage,
      cards: [
        ...cards,
        { ...state.cards[5]!, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } },
      ],
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-15 Distinguish new cards from waiting for their next review", async () => {
      const fresh = await canvas.findByRole("article", { name: deck.name });
      await expect(within(fresh).getByText("0 due · 5 new")).toBeVisible();
      await expect(within(fresh).getByRole("button", { name: `Study new cards in ${deck.name}` })).toBeEnabled();
      const waiting = within(canvas.getByRole("article", { name: otherDeck.name }));
      await userEvent.click(waiting.getByText("No due or new cards"));
      await expect(waiting.getByText(/Next review:/)).toBeVisible();
      await expect(
        waiting.queryByRole("button", { name: `Study new cards in ${otherDeck.name}` })
      ).not.toBeInTheDocument();
    });
  },
};
export const ActiveProgress: Story = {
  parameters: { page: { ...state, sessionsByDeckId: session(2), path: "/" } },
  play: async ({ canvas, step }) => {
    await step(
      "STORYBOOK-DECK-LIST-09 STORYBOOK-DECK-LIST-17 Combine active and unstarted decks while identifying the active position",
      async () => {
        const list = await canvas.findByRole("region", { name: "Decks" });
        await expect(within(list).getAllByRole("article")).toHaveLength(2);
        const active = within(canvas.getByRole("article", { name: deck.name }));
        await expect(active.getByText("Studying · Card 3 of 5")).toBeVisible();
        await expect(active.getByRole("button", { name: `Continue ${deck.name}` })).toBeVisible();
        const other = within(canvas.getByRole("article", { name: otherDeck.name }));
        await expect(other.queryByText(/Studying ·/)).not.toBeInTheDocument();
        await expect(other.getByRole("button", { name: `Study ${otherDeck.name}` })).toBeVisible();
      }
    );
  },
};
export const View: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-04 STORYBOOK-DECK-LIST-19 Browse the selected deck through its menu", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: `Open actions for ${otherDeck.name}` }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "View" }));
      await expect(await canvas.findByRole("button", { name: "Card front" })).toHaveTextContent("Other prompt");
      await expect(canvas.queryByText("Hello")).not.toBeInTheDocument();
      await expect(canvas.getByRole("slider", { name: "Viewing progress" })).toHaveAttribute(
        "aria-valuetext",
        "1 of 1"
      );
    });
  },
};
export const Edit: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-19 Edit the selected deck's saved values", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: `Open actions for ${otherDeck.name}` }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "Edit" }));
      await expect(await canvas.findByRole("textbox", { name: "Name" })).toHaveValue(otherDeck.name);
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("python");
    });
  },
};
export const History: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-08 Open the real history route", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Study history" }));
      await expect(await canvas.findByRole("heading", { name: "Study history" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "30 days" })).toBeVisible();
    });
  },
};
export const Menus: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-10 Keep only the last-opened deck menu", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: `Open actions for ${deck.name}` }));
      await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${otherDeck.name}` }));
      await expect(canvas.getAllByRole("menu")).toHaveLength(1);
      await expect(canvas.getByRole("menu", { name: `Actions for ${otherDeck.name}` })).toBeVisible();
    });
    await step("STORYBOOK-DECK-LIST-22 Omit Restart for an unstarted deck", async () => {
      await expect(canvas.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: `Study ${otherDeck.name}` })).toBeEnabled();
    });
    await step("STORYBOOK-DECK-LIST-23 Move focus through menu items without triggering navigation", async () => {
      canvas.getByRole("menuitem", { name: "View" }).focus();
      await userEvent.keyboard("{ArrowDown}");
      await expect(canvas.getByRole("menuitem", { name: "Download" })).toHaveFocus();
      await userEvent.keyboard("{ArrowUp}");
      await expect(canvas.getByRole("menuitem", { name: "View" })).toHaveFocus();
      await expect(canvas.getByRole("heading", { name: "Decks" })).toBeVisible();
    });
    await step("STORYBOOK-DECK-LIST-25 Close the menu without stealing focus moved outside", async () => {
      const add = canvas.getByRole("button", { name: "Add" });
      add.focus();
      await waitFor(() => expect(canvas.queryByRole("menu")).not.toBeInTheDocument());
      await expect(add).toHaveFocus();
    });
    await step(
      "STORYBOOK-DECK-LIST-24 Preserve the menu during internal focus movement and execute the chosen item",
      async () => {
        await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${otherDeck.name}` }));
        canvas.getByRole("menuitem", { name: "View" }).focus();
        await userEvent.keyboard("{ArrowDown}{ArrowDown}");
        await expect(canvas.getByRole("menuitem", { name: "Edit" })).toHaveFocus();
        await userEvent.keyboard("{Enter}");
        await expect(await canvas.findByRole("textbox", { name: "Name" })).toHaveValue(otherDeck.name);
      }
    );
  },
};
export const Download: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-LIST-07 Start the selected deck download and close its menu", async () => {
      const browserDownload = mocked(downloadTextFile).mockImplementation(() => undefined);
      try {
        await userEvent.click(await canvas.findByRole("button", { name: `Open actions for ${deck.name}` }));
        await userEvent.click(canvas.getByRole("menuitem", { name: "Download" }));
        await expect(browserDownload).toHaveBeenCalledWith(
          expect.stringContaining("Hello"),
          `${deck.name}.csv`,
          expect.any(String)
        );
        await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      } finally {
        browserDownload.mockRestore();
      }
    });
  },
};
export const LocalDeck: Story = {
  parameters: { page: { ...state, decks: [{ ...deck, uid: "" }], cards: [], path: "/" } },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-LIST-20 Omit remote synchronization indicators for local data", async () => {
      const row = await canvas.findByRole("article", { name: deck.name });
      await expect(within(row).queryByText("Remote deck")).not.toBeInTheDocument();
      await expect(within(row).getByRole("button", { name: `Study ${deck.name}` })).toBeVisible();
    });
  },
};
export const PendingDeletion: Story = {
  play: async ({ canvas, userEvent, step }) => {
    const target = await canvas.findByRole("button", { name: `Study ${deck.name}` });
    const other = canvas.getByRole("button", { name: `Study ${otherDeck.name}` });
    const menuTrigger = canvas.getByRole("button", { name: `Open actions for ${deck.name}` });
    let finish!: () => void;
    mocked(deleteDeck).mockImplementationOnce(async () => {
      await new Promise<void>((resolve) => {
        finish = resolve;
      });
      throw new Error("Unavailable");
    });
    await step("STORYBOOK-DECK-LIST-21 Disable only the deck with a pending delete request", async () => {
      await userEvent.click(menuTrigger);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Delete" }));
      await userEvent.click(
        within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Delete deck" })
      );
      await expect(target).toBeDisabled();
      await expect(menuTrigger).toBeDisabled();
      await expect(other).toBeEnabled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-DECK-LIST-26 Keep the menu closed when the failed operation finishes", async () => {
      finish();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await expect(target).toBeEnabled();
      await expect(menuTrigger).toBeEnabled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await userEvent.click(menuTrigger);
      await expect(canvas.getByRole("menu", { name: `Actions for ${deck.name}` })).toBeVisible();
    });
  },
};
export const Layout: Story = {
  parameters: {
    page: {
      ...state,
      decks: Array.from({ length: 40 }, (_, index) => ({
        ...deck,
        id: `layout-${index}`,
        name: `Deck ${String(index + 1).padStart(2, "0")}`,
      })),
      cards: [],
      path: "/",
    },
  },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, step }) => {
    const header = await canvas.findByRole("banner");
    const first = canvas.getByRole("article", { name: "Deck 01" });
    const before = header.getBoundingClientRect();
    await step("STORYBOOK-APP-LAYOUT-02 Place initial content below the fixed header", async () => {
      await expect(first.getBoundingClientRect().top).toBeGreaterThanOrEqual(before.bottom);
    });
    await step("STORYBOOK-APP-LAYOUT-01 Scroll the page content while the header stays fixed", async () => {
      const scrolling = first.closest(".overflow-y-auto") as HTMLElement;
      await expect(scrolling.scrollHeight).toBeGreaterThan(scrolling.clientHeight);
      scrolling.scrollTop = 100;
      await fireEvent.scroll(scrolling);
      await expect(scrolling.scrollTop).toBe(100);
      await expect(header.getBoundingClientRect().top).toBe(before.top);
      await expect(
        canvas.getByRole("button", { name: "Open cards in Deck 01" }).getBoundingClientRect().top
      ).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    });
  },
};
