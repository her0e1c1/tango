import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { Preferences } from "@/entities/preference";

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { dismissToast, ToastViewport } from "@/shared/ui/toast";
import { actAsync } from "@/test/act";
import { createCard, createDeck, createPreferences } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  deleteCard: vi.fn(),
  editDeck: vi.fn(),
  getAuthUid: vi.fn<() => string>(),
  getCards: vi.fn<() => Card[]>(),
  deck: undefined as Deck | undefined,
  cards: [] as Card[],
  preferences: undefined as Preferences | undefined,
}));

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));
vi.mock("@/entities/auth", () => ({
  useAuth: () => ({ uid: "user-id" }),
  getAuthUid: mocks.getAuthUid,
}));
vi.mock("@/entities/card", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/card")>()),
  deleteCard: mocks.deleteCard,
  getCards: mocks.getCards,
  useCards: () => mocks.cards,
  useCardsByDeckId: () => ({
    cards: mocks.cards,
    tags: [...new Set(mocks.cards.flatMap((candidate) => candidate.tags))],
  }),
}));
vi.mock("@/entities/deck", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/deck")>()),
  editDeck: mocks.editDeck,
  useDeck: () => mocks.deck,
}));
vi.mock("@/entities/preference", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preference")>()),
  usePreferences: () => mocks.preferences,
}));
import { CardListPage } from "./CardListPage";

const deck = createDeck({
  id: "deck-id",
  category: "raw",
  cardFilter: { selectedTags: ["typescript", "react"], tagAndFilter: false },
});
const card = createCard({
  id: "card-id",
  deckId: deck.id,
  frontText: "Front",
  backText: "Back",
  tags: ["typescript", "react"],
});

interface RenderCardListOptions {
  deck: Deck;
  cards: Card[];
  preferences: Preferences;
}

const defaultOptions: RenderCardListOptions = {
  deck,
  cards: [card],
  preferences: createPreferences({ appearance: { darkMode: false } }),
};

const createCardListPage = (deckId: string) => (
  <>
    <MemoryRouter initialEntries={[`/deck/${deckId}`]}>
      <Routes>
        <Route path="/" element={<h1>Deck list destination</h1>} />
        <Route path="/settings" element={<h1>Settings destination</h1>} />
        <Route path="/deck/:id" element={<CardListPage />} />
        <Route path="/card/:id/edit" element={<h1>Card editor destination</h1>} />
      </Routes>
    </MemoryRouter>
    <ToastViewport />
  </>
);

const renderCardList = (overrides: Partial<RenderCardListOptions> = {}) => {
  const options = { ...defaultOptions, ...overrides };
  mocks.deck = options.deck;
  mocks.cards = options.cards;
  mocks.preferences = options.preferences;

  return render(createCardListPage(options.deck.id));
};

const startListMutation = async () => {
  await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
  await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
  fireEvent.click(screen.getByRole("button", { name: "Delete card" }));
};

const staleMutationCases = [
  { mutation: "deletion", outcome: "success" },
  { mutation: "deletion", outcome: "failure" },
] as const;

describe("CARD-VIEW-02 CARD-MANAGEMENT-02 CARD-MANAGEMENT-08 CARD-MANAGEMENT-03 CARD-LIST-ACTIONS-01 CARD-LIST-ACTIONS-02 CARD-LIST-ACTIONS-03 CardListPage interactions", () => {
  beforeEach(() => {
    dismissToast();
    vi.clearAllMocks();
    mocks.getAuthUid.mockReturnValue("user-id");
    mocks.getCards.mockImplementation(() => mocks.cards);
    mocks.deleteCard.mockResolvedValue(undefined);
    mocks.editDeck.mockImplementation((_uid, patch) => {
      if (mocks.deck) mocks.deck = { ...mocks.deck, ...patch };
      return Promise.resolve();
    });
  });

  it("sorts by creation time with stable ties and restores the live standard order without writes", async () => {
    const oldest = createCard({ ...card, createdAt: 1000, updatedAt: 9000 });
    const newest = createCard({ ...card, id: "new", frontText: "New", createdAt: 3000 });
    const tied = createCard({ ...card, id: "tie", frontText: "Tie", createdAt: 3000 });
    const source = [oldest, newest, tied];
    const view = renderCardList({ cards: source });
    const names = () =>
      screen
        .getAllByRole("button", { name: /^View / })
        .map((button) => button.getAttribute("aria-label")?.replace(/^View /, ""));
    expect(names()).toEqual(["Front", "New", "Tie"]);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort order" }), "newest");
    expect(names()).toEqual(["New", "Tie", "Front"]);
    expect(source.map(({ id }) => id)).toEqual([oldest.id, newest.id, tied.id]);
    expect(screen.getByText("3 cards")).toBeVisible();

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(screen.getByRole("button", { name: "Close card" })).toHaveTextContent(oldest.backText);
    await userEvent.click(screen.getByRole("button", { name: "Close card" }));
    expect(screen.getByRole("combobox", { name: "Sort order" })).toHaveValue("newest");

    mocks.cards = [
      oldest,
      { ...tied, frontText: "Updated tie" },
      createCard({ ...card, id: "added", frontText: "Added", createdAt: 4000 }),
    ];
    view.rerender(createCardListPage(deck.id));
    expect(names()).toEqual(["Added", "Updated tie", "Front"]);
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Sort order" }), "standard");
    expect(names()).toEqual(["Front", "Updated tie", "Added"]);
    expect(mocks.editDeck).not.toHaveBeenCalled();
    expect(mocks.deleteCard).not.toHaveBeenCalled();
  });

  it("retains sorting for empty filtered results and permits sorting during filter autosave", async () => {
    const saving = Promise.withResolvers<void>();
    mocks.editDeck.mockReturnValue(saving.promise);
    renderCardList({ cards: [{ ...card, tags: ["typescript"] }] });
    await userEvent.click(screen.getByText("Filters"));
    await userEvent.click(screen.getByRole("checkbox", { name: "typescript" }));
    expect(screen.getByText("0 cards")).toBeVisible();
    expect(screen.getByRole("button", { name: "Actions" })).toBeDisabled();
    const sort = screen.getByRole("combobox", { name: "Sort order" });
    expect(sort).toBeEnabled();
    await userEvent.selectOptions(sort, "newest");
    await actAsync(async () => {
      saving.resolve();
      await saving.promise;
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "typescript" }));
    expect(await screen.findByRole("button", { name: "View Front" })).toBeVisible();
    expect(sort).toHaveValue("newest");
    expect(screen.getByRole("checkbox", { name: "typescript" })).toBeVisible();
    expect(screen.getByRole("checkbox", { name: "react" })).toBeVisible();
  });

  it("removes a selected tag via keyboard, keeps focus on the remaining chip, and continues Tab navigation", async () => {
    const user = userEvent.setup();
    const otherMatchingCard = createCard({
      id: "card-2",
      deckId: deck.id,
      frontText: "Second card",
      backText: "Back 2",
      tags: ["typescript", "react"],
    });
    renderCardList({ cards: [card, otherMatchingCard] });

    const typescriptChip = screen.getByRole("button", { name: "Remove typescript filter" });
    typescriptChip.focus();
    expect(typescriptChip).toHaveFocus();

    await user.keyboard("{Enter}");

    const reactChip = screen.getByRole("button", { name: "Remove react filter" });
    expect(reactChip).toHaveFocus();
    expect(screen.queryByRole("button", { name: "Remove typescript filter" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View Front" })).toBeVisible();
    expect(screen.getByRole("button", { name: "View Second card" })).toBeVisible();

    await user.tab();
    expect(screen.getByRole("button", { name: "View Front" })).toHaveFocus();

    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", {
      id: deck.id,
      cardFilter: { selectedTags: ["react"], tagAndFilter: false },
    });
  });

  it("removes the final selected tag via keyboard and moves focus to the closed filters summary", async () => {
    const user = userEvent.setup();
    renderCardList({ deck: { ...deck, cardFilter: { selectedTags: ["react"], tagAndFilter: false } } });

    const reactChip = screen.getByRole("button", { name: "Remove react filter" });
    reactChip.focus();
    expect(reactChip).toHaveFocus();

    await user.keyboard(" ");

    expect(screen.queryByRole("button", { name: "Remove react filter" })).not.toBeInTheDocument();
    const summary = screen.getByText((_, element) => element?.textContent?.startsWith("Filters") === true, {
      selector: "summary",
    });
    expect(summary).toHaveFocus();
    expect(summary).toHaveAccessibleName(/Filters\s*No filters/);

    expect(mocks.editDeck).toHaveBeenCalledWith("user-id", {
      id: deck.id,
      cardFilter: { selectedTags: [], tagAndFilter: false },
    });
  });

  it("keeps chips usable during autosave and does not steal focus when saving finishes", async () => {
    let resolveSave: () => void = vi.fn();
    mocks.editDeck.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const user = userEvent.setup();
    renderCardList();

    const typescriptChip = screen.getByRole("button", { name: "Remove typescript filter" });
    typescriptChip.focus();
    await user.keyboard("{Enter}");

    const reactChip = screen.getByRole("button", { name: "Remove react filter" });
    expect(reactChip).toHaveFocus();
    expect(reactChip).toBeEnabled();
    await user.keyboard("{Enter}");

    expect(screen.queryByRole("button", { name: "Remove react filter" })).not.toBeInTheDocument();

    const settingsButton = screen.getByRole("button", { name: "Open settings" });
    settingsButton.focus();
    expect(settingsButton).toHaveFocus();

    await actAsync(async () => {
      if (mocks.deck) mocks.deck = { ...mocks.deck, cardFilter: { selectedTags: [], tagAndFilter: false } };
      resolveSave();
      await Promise.resolve();
    });

    await waitFor(() => expect(screen.getByRole("button", { name: "View Front" })).toBeEnabled());
    expect(settingsButton).toHaveFocus();
    expect(mocks.editDeck).toHaveBeenLastCalledWith("user-id", {
      id: deck.id,
      cardFilter: { selectedTags: [], tagAndFilter: false },
    });
  });

  it("preserves focus and does not alter filter state when tabbing through tags without removing them", async () => {
    const user = userEvent.setup();
    renderCardList();

    const typescriptChip = screen.getByRole("button", { name: "Remove typescript filter" });
    typescriptChip.focus();
    expect(typescriptChip).toHaveFocus();

    await user.tab();
    const reactChip = screen.getByRole("button", { name: "Remove react filter" });
    expect(reactChip).toHaveFocus();

    await user.tab({ shift: true });
    expect(typescriptChip).toHaveFocus();

    expect(mocks.editDeck).not.toHaveBeenCalled();
  });

  it("coordinates Card view and edit navigation", async () => {
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));
    expect(screen.getByText("Back")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Close card" }));

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Card editor destination" })).toBeVisible();
  });

  it("renders a language Card answer in the overlay", async () => {
    const languageCard = createCard({ ...card, backText: "const answer = 42;", tags: ["typescript"] });
    renderCardList({
      deck: { ...deck, cardFilter: { selectedTags: ["typescript"], tagAndFilter: false } },
      cards: [languageCard],
      preferences: createPreferences({ appearance: { darkMode: true } }),
    });

    await userEvent.click(screen.getByRole("button", { name: "View Front" }));

    expect(screen.getByLabelText("Close card")).toHaveTextContent(languageCard.backText);
  });

  it.each([true, false])(
    "keeps the confirmation snapshot when the Card disappears (confirmed: %s)",
    async (confirmed) => {
      const write = Promise.withResolvers<void>();
      if (confirmed) mocks.deleteCard.mockReturnValueOnce(write.promise);
      const { rerender } = renderCardList();

      await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
      await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
      expect(screen.getByRole("alertdialog", { name: "Delete card?" })).toBeVisible();
      if (confirmed) await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

      mocks.cards = [];
      rerender(createCardListPage(deck.id));
      const dialog = screen.getByRole("alertdialog", { name: "Delete card?" });
      expect(dialog).toBeVisible();
      expect(within(dialog).getByText("Front")).toBeVisible();
      expect(
        screen.queryAllByRole("button", { name: "Delete card" }).map((button) => button.hasAttribute("disabled"))
      ).toEqual([confirmed]);
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveProperty("disabled", confirmed);
      expect(screen.queryByRole("article")).not.toBeInTheDocument();

      if (!confirmed) await userEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(mocks.deleteCard).toHaveBeenCalledTimes(confirmed ? 1 : 0);

      await actAsync(async () => {
        write.resolve();
        await write.promise;
      });
      expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();
      expect(screen.queryAllByText("Deleted card “Front”.")).toHaveLength(confirmed ? 1 : 0);
      expect(
        screen.queryByText("Unable to delete this card. Check your connection and try again.")
      ).not.toBeInTheDocument();
      fireEvent.keyDown(window, { key: "t" });
      expect(await screen.findByRole("heading", { name: "Deck list destination" })).toBeVisible();
    }
  );

  it("closes a failed deletion and retries after reopening the same Card", async () => {
    mocks.deleteCard.mockRejectedValueOnce(new Error("delete failed"));
    renderCardList();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    expect(await screen.findByText("Unable to delete this card. Check your connection and try again.")).toBeVisible();
    expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Open actions for Front" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete card" }));

    await waitFor(() => expect(screen.queryByRole("alertdialog", { name: "Delete card?" })).not.toBeInTheDocument());
    expect(mocks.deleteCard).toHaveBeenCalledTimes(2);
    expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
  });

  it.each(staleMutationCases)("ignores $mutation $outcome after leaving the page", async ({ outcome }) => {
    const write = Promise.withResolvers<void>();
    const save = mocks.deleteCard;
    save.mockReturnValueOnce(write.promise);
    const view = renderCardList();
    await startListMutation();
    expect(save).toHaveBeenCalledOnce();

    view.unmount();
    render(<ToastViewport />);
    await actAsync(async () => {
      if (outcome === "success") write.resolve();
      else write.reject(new Error("late write failure"));
      await write.promise.catch(() => undefined);
    });

    expect(screen.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    renderCardList();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actions" })).toBeEnabled();
  });

  it.each(staleMutationCases)(
    "keeps the new mutation and dialog pending when an old $mutation ends in $outcome after revisiting",
    async ({ outcome }) => {
      const oldWrite = Promise.withResolvers<void>();
      const newWrite = Promise.withResolvers<void>();
      const oldSave = mocks.deleteCard;
      oldSave.mockReturnValueOnce(oldWrite.promise);
      const view = renderCardList();
      await startListMutation();
      expect(oldSave).toHaveBeenCalledOnce();
      view.unmount();

      // Keep B's dialog open so A cannot silently close it or release B's lock.
      const newSave = mocks.deleteCard;
      newSave.mockReturnValueOnce(newWrite.promise);
      renderCardList();
      await startListMutation();
      const dialog = screen.getByRole("alertdialog");
      const confirm = within(dialog).getByRole("button", {
        name: "Delete card",
      });
      const callsBeforeCompletion = newSave.mock.calls.length;
      expect(confirm).toBeDisabled();

      await actAsync(async () => {
        if (outcome === "success") oldWrite.resolve();
        else oldWrite.reject(new Error("late write failure"));
        await oldWrite.promise.catch(() => undefined);
      });

      expect(dialog).toBeVisible();
      expect(confirm).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Cancel" })).toBeDisabled();
      expect(screen.getByRole("status", { name: "Toast notifications" })).toBeEmptyDOMElement();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      fireEvent.click(confirm);
      expect(newSave).toHaveBeenCalledTimes(callsBeforeCompletion);

      await actAsync(async () => {
        newWrite.resolve();
        await newWrite.promise;
      });
      expect(dialog).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Actions" })).toBeEnabled();
      expect(screen.getByText("Deleted card “Front”.")).toBeVisible();
    }
  );
});

vi.mock("@/entities/card/model/queries/getCards", () => ({ getCards: vi.fn<() => Card[]>() }));
vi.mock("@/entities/card/model/queries/useCards", () => ({ useCards: () => mocks.cards }));
