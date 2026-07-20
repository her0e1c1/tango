/**
 * @file Verifies the "DeckListContainer" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "renders every active deck
 * in recent order and inactive decks by name", "touches only the selected session before
 * continuing", "routes Study and Restart through the start screen".
 */

import { act, cleanup, fireEvent, render, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { studyStore } from "@/features/study/state/studyStore";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  config: {} as ConfigState,
  decksById: {} as Record<DeckId, Deck>,
  cardsById: {} as Record<CardId, Card>,
  hydrated: true,
  pending: false,
  pendingDeckIds: new Set<DeckId>(),
  error: null as unknown,
  onRemoveSuccess: undefined as ((deck: Deck) => void) | undefined,
  remove: vi.fn(async (_deck: Deck) => undefined),
  retry: vi.fn(),
  downloadData: vi.fn(),
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

vi.mock("@/hooks/useConfig", () => ({ useConfig: () => mocks.config }));
vi.mock("@/features/study/hooks/useStudyHydrated", () => ({ useStudyHydrated: () => mocks.hydrated }));
vi.mock("@/action", () => ({ deck: { downloadData: mocks.downloadData } }));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => {
    const decks = Object.values(mocks.decksById);
    const cards = Object.values(mocks.cardsById);
    return {
      status: "ready" as const,
      retry: vi.fn(),
      decks,
      cards,
      deckById: (id: DeckId) => mocks.decksById[id],
      cardsByDeckId: (id: DeckId) => cards.filter((card) => card.deckId === id),
    };
  },
}));
vi.mock("react-use", () => ({ useKey: vi.fn() }));
vi.mock("@/hooks/useActions", () => ({ useActions: () => mocks.actions }));
vi.mock("@/features/deck/hooks/useDeckMutations", () => ({
  useDeckMutations: (options?: { onRemoveSuccess?: (deck: Deck) => void }) => {
    mocks.onRemoveSuccess = options?.onRemoveSuccess;
    return {
      remove: (deck: Deck) => mocks.remove(deck).then(() => mocks.onRemoveSuccess?.(deck)),
      pending: mocks.pending,
      isPending: (id: DeckId) => mocks.pendingDeckIds.has(id),
      error: mocks.error,
      retry: mocks.retry,
    };
  },
}));
vi.mock("@/features/import/hooks/useSampleDeckBootstrap", () => ({ useSampleDeckBootstrap: vi.fn() }));

import { DeckListContainer } from "@/features/deck/containers/DeckListContainer";

describe("DeckListContainer", () => {
  const recentDeck = createDeck({ id: "recent", name: "Recent deck", category: "math" });
  const oldDeck = createDeck({ id: "old", name: "Old deck", category: "design" });
  const otherDeck = createDeck({ id: "other", name: "Alpha deck", category: "history" });

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mocks.hydrated = true;
    mocks.pending = false;
    mocks.pendingDeckIds = new Set();
    mocks.error = null;
    mocks.onRemoveSuccess = undefined;
    mocks.config = createConfig({ darkMode: false });
    mocks.decksById = { [otherDeck.id]: otherDeck, [oldDeck.id]: oldDeck, [recentDeck.id]: recentDeck };
    mocks.cardsById = {
      "other-1": createCard({ id: "other-1", deckId: otherDeck.id }),
      "other-2": createCard({ id: "other-2", deckId: otherDeck.id }),
    };
    studyStore.setState({
      sessionsByDeckId: {
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
      },
      showBackText: false,
      autoPlay: false,
      lastSwipe: undefined,
    });
  });

  afterEach(() => {
    cleanup();
    studyStore.setState({ sessionsByDeckId: {} });
    vi.restoreAllMocks();
  });

  it("renders every active deck in recent order and inactive decks by name", () => {
    const view = render(<DeckListContainer />);

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
    const view = render(<DeckListContainer />);

    fireEvent.click(view.getByRole("button", { name: "Continue Recent deck" }));

    expect(mocks.actions.goToStudy).toHaveBeenCalledExactlyOnceWith(recentDeck.id);
    expect(studyStore.getState().sessionsByDeckId[recentDeck.id]?.lastStudiedAt).toBe(9000);
    expect(studyStore.getState().sessionsByDeckId[oldDeck.id]?.lastStudiedAt).toBe(1000);
  });

  it("routes Study and Restart through the start screen", () => {
    const view = render(<DeckListContainer />);

    fireEvent.click(view.getByRole("button", { name: "Study Alpha deck" }));
    fireEvent.click(view.getByRole("button", { name: "Open actions for Recent deck" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Restart" }));

    expect(mocks.actions.goToStart).toHaveBeenNthCalledWith(1, otherDeck.id);
    expect(mocks.actions.goToStart).toHaveBeenNthCalledWith(2, recentDeck.id);
  });

  it("removes only the deleted deck session after the remote delete succeeds", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const view = render(<DeckListContainer />);

    fireEvent.click(view.getByRole("button", { name: "Open actions for Recent deck" }));
    fireEvent.click(view.getByRole("menuitem", { name: "Delete" }));

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledExactlyOnceWith(recentDeck));
    await waitFor(() => expect(studyStore.getState().sessionsByDeckId[recentDeck.id]).toBeUndefined());
    expect(studyStore.getState().sessionsByDeckId[oldDeck.id]).toBeDefined();
  });

  it("owns successful removal cleanup through the Deck mutation lifecycle", () => {
    render(<DeckListContainer />);

    expect(mocks.onRemoveSuccess).toBeTypeOf("function");
    act(() => mocks.onRemoveSuccess?.(recentDeck));

    expect(studyStore.getState().sessionsByDeckId[recentDeck.id]).toBeUndefined();
    expect(studyStore.getState().sessionsByDeckId[oldDeck.id]).toBeDefined();
  });

  it("waits for study hydration before classifying decks", () => {
    mocks.hydrated = false;
    const view = render(<DeckListContainer />);

    expect(view.getByRole("status")).toHaveTextContent("Loading study progress");
    expect(view.queryByRole("region", { name: "Other decks" })).not.toBeInTheDocument();

    mocks.hydrated = true;
    view.rerender(<DeckListContainer />);
    expect(view.getByRole("region", { name: "Studying" })).toBeInTheDocument();
  });

  it("prunes sessions for decks that no longer exist", async () => {
    studyStore.setState((state) => ({
      sessionsByDeckId: {
        ...state.sessionsByDeckId,
        missing: { deckId: "missing", cardOrderIds: ["card"], currentIndex: 0, lastStudiedAt: 3000 },
      },
    }));

    render(<DeckListContainer />);

    await waitFor(() => expect(studyStore.getState().sessionsByDeckId.missing).toBeUndefined());
    expect(studyStore.getState().sessionsByDeckId[recentDeck.id]).toBeDefined();
  });

  it("does not prune an optimistically removed deck session while deletion is pending", () => {
    mocks.pending = true;
    delete mocks.decksById[recentDeck.id];

    const view = render(<DeckListContainer />);

    expect(studyStore.getState().sessionsByDeckId[recentDeck.id]).toBeDefined();

    mocks.pending = false;
    mocks.decksById[recentDeck.id] = recentDeck;
    view.rerender(<DeckListContainer />);
    expect(studyStore.getState().sessionsByDeckId[recentDeck.id]).toBeDefined();
  });

  it("shows Deck deletion feedback and disables only the pending row", () => {
    mocks.pending = true;
    mocks.pendingDeckIds = new Set([recentDeck.id]);
    mocks.error = new Error("delete failed");
    const view = render(<DeckListContainer />);

    expect(view.getByRole("alert")).toHaveTextContent("Unable to delete deck.");
    fireEvent.click(view.getByRole("button", { name: "Retry" }));
    expect(mocks.retry).toHaveBeenCalledOnce();
    expect(view.getByRole("button", { name: "View Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Continue Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "Open actions for Recent deck" })).toBeDisabled();
    expect(view.getByRole("button", { name: "View Alpha deck" })).not.toBeDisabled();
  });
});
