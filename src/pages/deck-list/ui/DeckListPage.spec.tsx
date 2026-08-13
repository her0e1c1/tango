/**
 * @file Verifies the Deck List Page composition contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders every active deck
 * in recent order and inactive decks by name" and "touches only the selected session before
 * continuing".
 */

import type { ConfigState } from "@/shared/config";

import { fireEvent, render, waitFor, within, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Card, CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import type { useStudySessions } from "@/features/study";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  decksById: {} as Record<DeckId, Deck>,
  cardsById: {} as Record<CardId, Card>,
  sessionsByDeckId: {} as ReturnType<typeof useStudySessions>,
  hydrated: true,
  pending: false,
  syncStatus: "synced" as "cached" | "pending" | "synced",
  pendingDeckIds: new Set<DeckId>(),
  error: null as unknown,
  onRemoveSuccess: undefined as ((deck: Deck) => void) | undefined,
  remove: vi.fn(async (_deck: Deck) => undefined),
  retry: vi.fn(),
  downloadDeckCsv: vi.fn(),
  discardStudySessionsMissingDecks: vi.fn<(deckIds: Iterable<DeckId>) => void>(),
  removeStudySession: vi.fn<(deckId: DeckId) => void>(),
  touchStudySession: vi.fn<(deckId: DeckId) => void>(),
  navigate: vi.fn(),
  setDarkMode: vi.fn(),
}));

vi.mock("@/shared/config", () => ({
  useConfig: () => mocks.config,
  setDarkMode: mocks.setDarkMode,
}));
vi.mock("@/features/study", () => ({
  discardStudySessionsMissingDecks: mocks.discardStudySessionsMissingDecks,
  removeStudySession: mocks.removeStudySession,
  touchStudySession: mocks.touchStudySession,
  useStudyHydrated: () => mocks.hydrated,
  useStudySessions: () => mocks.sessionsByDeckId,
}));
vi.mock("@/features/export", () => ({ downloadDeckCsv: mocks.downloadDeckCsv }));
vi.mock("@/entities/card", () => ({
  selectCardsForDeck: (cards: Card[], id: DeckId) => cards.filter((card) => card.deckId === id),
  useCards: () => {
    const cards = Object.values(mocks.cardsById);
    return { status: "ready" as const, retry: vi.fn(), cards };
  },
}));
vi.mock("@/entities/deck", () => ({
  useDecks: () => ({
    status: "ready" as const,
    syncStatus: mocks.syncStatus,
    retry: vi.fn(),
    decks: Object.values(mocks.decksById),
    decksById: mocks.decksById,
  }),
}));
vi.mock("@/features/deck/delete", () => ({
  useDeleteDeck: (options?: { onSuccess?: (deck: Deck) => void }) => {
    mocks.onRemoveSuccess = options?.onSuccess;
    return {
      remove: (deck: Deck) => mocks.remove(deck).then(() => mocks.onRemoveSuccess?.(deck)),
      pending: mocks.pending,
      isPending: (id: DeckId) => mocks.pendingDeckIds.has(id),
      error: mocks.error,
      retry: mocks.retry,
    };
  },
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => mocks.navigate }));
vi.mock("@/features/import", () => ({ useSampleDeckBootstrap: vi.fn() }));

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
    vi.restoreAllMocks();
  });

  it("renders every active deck in recent order and inactive decks by name", () => {
    render(<DeckListPage />);

    const studying = screen.getByRole("region", { name: "Studying" });
    expect(
      within(studying)
        .getAllByRole("button", { name: /^View / })
        .map((button) => button.getAttribute("aria-label"))
    ).toEqual(["View Recent deck", "View Old deck"]);
    expect(within(studying).getByText(/2 \/ 3/)).toBeInTheDocument();

    const other = screen.getByRole("region", { name: "Other decks" });
    expect(within(other).getByRole("button", { name: "View Alpha deck" })).toBeInTheDocument();
    expect(within(other).getByText("2 cards")).toBeInTheDocument();
  });

  it("touches only the selected session before continuing", () => {
    vi.spyOn(Date, "now").mockReturnValue(9000);
    render(<DeckListPage />);

    fireEvent.click(screen.getByRole("button", { name: "Continue Recent deck" }));

    expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith(`/deck/${recentDeck.id}/study`);
    expect(mocks.touchStudySession).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(mocks.sessionsByDeckId[recentDeck.id]?.lastStudiedAt).toBe(9000);
    expect(mocks.sessionsByDeckId[oldDeck.id]?.lastStudiedAt).toBe(1000);
  });

  it("navigates through deck interactions", () => {
    render(<DeckListPage />);

    fireEvent.click(screen.getByRole("button", { name: "View Alpha deck" }));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/deck/${otherDeck.id}`);

    fireEvent.click(screen.getByRole("button", { name: "Study Alpha deck" }));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/deck/${otherDeck.id}/start`);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Alpha deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Download" }));
    expect(mocks.downloadDeckCsv).toHaveBeenCalledExactlyOnceWith(otherDeck, [
      mocks.cardsById["other-1"],
      mocks.cardsById["other-2"],
    ]);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Alpha deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/deck/${otherDeck.id}/edit`);

    fireEvent.click(screen.getByRole("button", { name: "Open actions for Recent deck" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Restart" }));
    expect(mocks.navigate).toHaveBeenLastCalledWith(`/deck/${recentDeck.id}/start`);
  });

  it("navigates from settings and import keyboard shortcuts", () => {
    render(<DeckListPage />);

    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "i" });

    expect(mocks.navigate).toHaveBeenNthCalledWith(1, "/settings");
    expect(mocks.navigate).toHaveBeenNthCalledWith(2, "/import");
  });

  it("renders the application shell", () => {
    render(<DeckListPage />);

    expect(screen.getByRole("button", { name: "tango" })).toBeVisible();
  });

  it("removes only the deleted deck session after the remote delete succeeds", async () => {
    const confirm = vi.spyOn(window, "confirm");
    render(<DeckListPage />);
    const trigger = screen.getByRole("button", { name: "Open actions for Recent deck" });

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    const dialog = screen.getByRole("alertdialog", { name: "Delete deck?" });
    expect(dialog).toHaveTextContent("Recent deck");
    expect(dialog).toHaveTextContent("2 cards");
    expect(dialog).toHaveTextContent("in-progress study session");
    expect(dialog).toHaveTextContent("cannot be undone");
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole("menuitem", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete deck" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(recentDeck));
    await waitFor(() => expect(mocks.sessionsByDeckId[recentDeck.id]).toBeUndefined());
    expect(mocks.removeStudySession).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(mocks.sessionsByDeckId[oldDeck.id]).toBeDefined();
    expect(screen.getByRole("status")).toHaveTextContent("Deleted deck “Recent deck”.");
    expect(confirm).not.toHaveBeenCalled();
  });

  it("waits for study hydration before classifying decks", () => {
    mocks.hydrated = false;
    const view = render(<DeckListPage />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading study progress");
    expect(screen.queryByRole("region", { name: "Other decks" })).not.toBeInTheDocument();

    mocks.hydrated = true;
    view.rerender(<DeckListPage />);
    expect(screen.getByRole("region", { name: "Studying" })).toBeInTheDocument();
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
    render(<DeckListPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Unable to delete deck.");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "View Recent deck" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Continue Recent deck" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Open actions for Recent deck" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "View Alpha deck" })).not.toBeDisabled();
  });
});
