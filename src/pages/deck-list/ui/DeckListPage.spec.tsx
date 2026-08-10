/**
 * @file Verifies the Deck List Page composition contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders every active deck
 * in recent order and inactive decks by name" and "touches only the selected session before
 * continuing".
 */
import type { ConfigState } from "@/entities/config";

import { cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Card, CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import type { StudySession } from "@/features/study";
import { createCard } from "@/entities/card";
import { createConfig } from "@/entities/config";
import { createDeck } from "@/entities/deck";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  decksById: {} as Record<DeckId, Deck>,
  cardsById: {} as Record<CardId, Card>,
  sessionsByDeckId: {} as Partial<Record<DeckId, StudySession>>,
  hydrated: true,
  pending: false,
  syncStatus: "synced" as "cached" | "pending" | "synced",
  pendingDeckIds: new Set<DeckId>(),
  error: null as unknown,
  onRemoveSuccess: undefined as ((deck: Deck) => void) | undefined,
  remove: vi.fn(async (_deck: Deck) => undefined),
  retry: vi.fn(),
  downloadData: vi.fn(),
  discardStudySessionsMissingDecks: vi.fn<(deckIds: Iterable<DeckId>) => void>(),
  removeStudySession: vi.fn<(deckId: DeckId) => void>(),
  touchStudySession: vi.fn<(deckId: DeckId) => void>(),
  actions: {
    goToSettings: vi.fn(),
    goToImport: vi.fn(),
    setDarkMode: vi.fn(),
    goToTop: vi.fn(),
    goByMenu: vi.fn(),
    goToEdit: vi.fn(),
    goToView: vi.fn(),
    goToStudy: vi.fn(),
    goToStart: vi.fn(),
  },
}));

vi.mock("@/entities/config", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/config")>()),
  useConfig: () => mocks.config,
}));
vi.mock("@/shared/auth", () => ({ useAuth: () => ({ status: "authenticated", uid: "uid-a" }) }));
vi.mock("@/features/study", () => ({
  discardStudySessionsMissingDecks: mocks.discardStudySessionsMissingDecks,
  removeStudySession: mocks.removeStudySession,
  touchStudySession: mocks.touchStudySession,
  useStudyHydrated: () => mocks.hydrated,
  useStudySessions: () => mocks.sessionsByDeckId,
}));
vi.mock("@/features/remote-collections", () => ({
  useRemoteCollections: () => {
    const decks = Object.values(mocks.decksById);
    const cards = Object.values(mocks.cardsById);
    return {
      status: "ready" as const,
      syncStatus: mocks.syncStatus,
      retry: vi.fn(),
      decks,
      cards,
      deckById: (id: DeckId) => mocks.decksById[id],
      cardById: (id: CardId) => mocks.cardsById[id],
      cardsByDeckId: (id: DeckId) => cards.filter((card) => card.deckId === id),
    };
  },
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));
vi.mock("@/features/app-controls", () => ({ useActions: () => mocks.actions }));
vi.mock("@/features/deck", () => ({
  useDeckMutations: (options?: { onRemoveSuccess?: (deck: Deck) => void }) => {
    mocks.onRemoveSuccess = options?.onRemoveSuccess;
    return {
      create: vi.fn(),
      remove: (deck: Deck) => mocks.remove(deck).then(() => mocks.onRemoveSuccess?.(deck)),
      pending: mocks.pending,
      isPending: (id: DeckId) => mocks.pendingDeckIds.has(id),
      error: mocks.error,
      retry: mocks.retry,
    };
  },
}));
vi.mock("@/features/card", () => ({ useCardMutations: () => ({ bulkUpsert: vi.fn() }) }));
vi.mock("@/features/import", () => ({
  downloadDeckData: mocks.downloadData,
  useDeckImport: () => ({ addSample: vi.fn() }),
  useSampleDeckBootstrap: vi.fn(),
}));

import { DeckListPage } from "./DeckListPage";

describe("DeckListPage", () => {
  const recentDeck = createDeck({ id: "recent", name: "Recent deck", category: "math" });
  const oldDeck = createDeck({ id: "old", name: "Old deck", category: "design" });
  const otherDeck = createDeck({ id: "other", name: "Alpha deck", category: "history" });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.hydrated = true;
    mocks.pending = false;
    mocks.syncStatus = "synced";
    mocks.pendingDeckIds = new Set();
    mocks.error = null;
    mocks.onRemoveSuccess = undefined;
    mocks.config = createConfig({ darkMode: false });
    mocks.decksById = { [otherDeck.id]: otherDeck, [oldDeck.id]: oldDeck, [recentDeck.id]: recentDeck };
    mocks.cardsById = {
      "other-1": createCard({ id: "other-1", deckId: otherDeck.id }),
      "other-2": createCard({ id: "other-2", deckId: otherDeck.id }),
      "recent-1": createCard({ id: "recent-1", deckId: recentDeck.id }),
      "recent-2": createCard({ id: "recent-2", deckId: recentDeck.id }),
    };
    mocks.sessionsByDeckId = {
      [oldDeck.id]: {
        deckId: oldDeck.id,
        cardOrderIds: ["old-1", "old-2"],
        currentIndex: 0,
        lastStudiedAt: 1000,
      },
      [recentDeck.id]: {
        deckId: recentDeck.id,
        cardOrderIds: ["recent-1", "recent-2", "recent-3"],
        currentIndex: 1,
        lastStudiedAt: 2000,
      },
    };
    mocks.touchStudySession.mockImplementation((deckId) => {
      const session = mocks.sessionsByDeckId[deckId];
      if (session != null) mocks.sessionsByDeckId[deckId] = { ...session, lastStudiedAt: Date.now() };
    });
    mocks.removeStudySession.mockImplementation((deckId) => {
      delete mocks.sessionsByDeckId[deckId];
    });
    mocks.discardStudySessionsMissingDecks.mockImplementation((deckIds) => {
      const availableDeckIds = new Set(deckIds);
      for (const deckId of Object.keys(mocks.sessionsByDeckId)) {
        if (!availableDeckIds.has(deckId)) delete mocks.sessionsByDeckId[deckId];
      }
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders every active deck in recent order and inactive decks by name", () => {
    const view = render(<DeckListPage />);

    const studying = view.getByRole("region", { name: "Studying" });
    expect(
      within(studying)
        .getAllByRole("button", { name: /^View / })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["View Recent deck", "View Old deck"]);
    expect(within(studying).getByText(/2 \/ 3/)).toBeInTheDocument();

    const other = view.getByRole("region", { name: "Other decks" });
    expect(within(other).getByRole("button", { name: "View Alpha deck" })).toBeInTheDocument();
    expect(within(other).getByText("2 cards")).toBeInTheDocument();
  });

  it("touches only the selected session before continuing", () => {
    vi.spyOn(Date, "now").mockReturnValue(9000);
    const view = render(<DeckListPage />);

    fireEvent.click(view.getByRole("button", { name: "Continue Recent deck" }));

    expect(mocks.actions.goToStudy).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(mocks.touchStudySession).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(mocks.sessionsByDeckId[recentDeck.id]?.lastStudiedAt).toBe(9000);
    expect(mocks.sessionsByDeckId[oldDeck.id]?.lastStudiedAt).toBe(1000);
  });

  it("removes only the deleted deck session after the remote delete succeeds", async () => {
    const confirm = vi.spyOn(window, "confirm");
    const view = render(<DeckListPage />);
    const trigger = view.getByRole("button", { name: "Open actions for Recent deck" });

    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    const dialog = view.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveTextContent("Recent deck");
    expect(dialog).toHaveTextContent("2 cards");
    expect(dialog).toHaveTextContent("in-progress study session");
    expect(dialog).toHaveTextContent("cannot be undone");
    expect(view.getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.click(view.getByRole("button", { name: "Cancel" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(view.getByRole("button", { name: "Delete deck" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(recentDeck));
    await waitFor(() => expect(mocks.sessionsByDeckId[recentDeck.id]).toBeUndefined());
    expect(mocks.removeStudySession).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(mocks.sessionsByDeckId[oldDeck.id]).toBeDefined();
    expect(view.getByRole("status")).toHaveTextContent("Deleted deck “Recent deck”.");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("waits for study hydration before classifying decks", () => {
    mocks.hydrated = false;
    const view = render(<DeckListPage />);

    expect(view.getByRole("status")).toHaveTextContent("Loading study progress");
    expect(view.queryByRole("region", { name: "Other decks" })).not.toBeInTheDocument();

    mocks.hydrated = true;
    view.rerender(<DeckListPage />);
    expect(view.getByRole("region", { name: "Studying" })).toBeInTheDocument();
  });

  it("prunes sessions for decks that no longer exist", async () => {
    mocks.sessionsByDeckId.missing = {
      deckId: "missing",
      cardOrderIds: ["card"],
      currentIndex: 0,
      lastStudiedAt: 3000,
    };

    render(<DeckListPage />);

    await waitFor(() => expect(mocks.sessionsByDeckId.missing).toBeUndefined());
    expect(mocks.discardStudySessionsMissingDecks).toHaveBeenCalled();
    expect(mocks.sessionsByDeckId[recentDeck.id]).toBeDefined();
  });

  it("keeps sessions while remote decks are only available from cache", () => {
    mocks.syncStatus = "cached";
    delete mocks.decksById[recentDeck.id];

    render(<DeckListPage />);

    expect(mocks.sessionsByDeckId[recentDeck.id]).toBeDefined();
    expect(mocks.discardStudySessionsMissingDecks).not.toHaveBeenCalled();
  });

  it("does not prune an optimistically removed deck session while deletion is pending", () => {
    mocks.pending = true;
    delete mocks.decksById[recentDeck.id];

    const view = render(<DeckListPage />);

    expect(mocks.sessionsByDeckId[recentDeck.id]).toBeDefined();
    expect(mocks.discardStudySessionsMissingDecks).not.toHaveBeenCalled();

    mocks.pending = false;
    mocks.decksById[recentDeck.id] = recentDeck;
    view.rerender(<DeckListPage />);
    expect(mocks.sessionsByDeckId[recentDeck.id]).toBeDefined();
  });

  it("shows Deck deletion feedback and disables only the pending row", () => {
    mocks.pending = true;
    mocks.pendingDeckIds = new Set([recentDeck.id]);
    mocks.error = new Error("delete failed");
    const view = render(<DeckListPage />);

    expect(view.getByRole("alert")).toHaveTextContent("Unable to delete deck.");
    fireEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(view.getByRole("button", { name: "View Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Continue Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Open actions for Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "View Alpha deck" })).not.toBeDisabled();
  });
});
