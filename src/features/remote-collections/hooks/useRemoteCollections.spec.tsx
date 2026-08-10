/**
 * @file Verifies the "useRemoteCollections" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "returns RemoteStore data
 * as the only Deck and Card read model", "exposes terminal state and Retry without dropping data",
 * "does not expose Store data until authenticated and active UIDs match".
 */

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteStoreState } from "@/features/remote-collections/model/remoteStore";
import { createCard } from "@/entities/card";
import { createDeck } from "@/entities/deck";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    decksById: {},
    cardsById: {},
  } as Omit<RemoteStoreState, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("@/shared/auth", () => ({
  useAuth: () => ({ status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } }),
}));
vi.mock("@/features/remote-collections/model/remoteStore", () => ({
  remoteStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { nextCardAvailabilityAt, useRemoteCollections } from "@/features/remote-collections";

describe("useRemoteCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: {},
      cardsById: {},
    };
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("returns RemoteStore data as the only Deck and Card read model", () => {
    const freshRemote = createDeck({ id: "fresh" });
    const freshRemoteCard = createCard({ id: "fresh-card", deckId: freshRemote.id, tags: ["z", "a"] });
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: { fresh: freshRemote },
      cardsById: { "fresh-card": freshRemoteCard },
    };

    const { result } = renderHook(useRemoteCollections);

    expect(result.current.decksById).toEqual({ fresh: freshRemote });
    expect(result.current.cardsById).toEqual({ "fresh-card": freshRemoteCard });
    expect(result.current.deckById(freshRemote.id)).toBe(freshRemote);
    expect(result.current.cardById(freshRemoteCard.id)).toBe(freshRemoteCard);
    expect(result.current.cardsByDeckId(freshRemote.id)).toEqual([freshRemoteCard]);
    expect(result.current.tagsByDeckId(freshRemote.id)).toEqual(["a", "z"]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("re-evaluates scheduled cards when their next review time arrives", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    const deck = createDeck({ id: "scheduled" });
    const card = createCard({ id: "scheduled-card", deckId: deck.id, nextSeeingAt: new Date(1_500) });
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: { [deck.id]: deck },
      cardsById: { [card.id]: card },
    };
    const { result } = renderHook(useRemoteCollections);

    expect(result.current.now).toBe(1_000);

    act(() => vi.advanceTimersByTime(499));
    expect(result.current.now).toBe(1_000);

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.now).toBe(1_500);
  });

  it("selects the nearest future review time", () => {
    const cards = [
      createCard({ id: "past", nextSeeingAt: new Date(900) }),
      createCard({ id: "later", nextSeeingAt: new Date(2_000) }),
      createCard({ id: "next", nextSeeingAt: new Date(1_500) }),
    ];

    expect(nextCardAvailabilityAt(cards, 1_000)).toBe(1_500);
  });

  it("exposes terminal state and retry without dropping Store data", () => {
    const error = new Error("terminal");
    const remoteDeck = createDeck({ id: "remote" });
    mocks.state = {
      uid: "uid-a",
      status: "error",
      error,
      decksById: { remote: remoteDeck },
      cardsById: {},
    };

    const { result } = renderHook(useRemoteCollections);
    result.current.retry();

    expect(result.current.decks).toEqual([remoteDeck]);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });

  it("does not expose Store data until authenticated and active UIDs match", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const remoteCard = createCard({ id: "remote-card", deckId: remoteDeck.id });
    mocks.state = {
      uid: "uid-b",
      status: "ready",
      syncStatus: "synced",
      decksById: { remote: remoteDeck },
      cardsById: { "remote-card": remoteCard },
    };

    const { result } = renderHook(useRemoteCollections);

    expect(result.current.decks).toEqual([]);
    expect(result.current.cards).toEqual([]);
    expect(result.current.deckById(remoteDeck.id)).toBeUndefined();
    expect(result.current.cardById(remoteCard.id)).toBeUndefined();
    expect(result.current.status).toBe("loading");
  });

  it("exposes persistent cache initialization failures as blocking state", () => {
    const blocker = new Error("another tab owns the cache");
    const remoteDeck = createDeck({ id: "remote" });
    mocks.state = {
      uid: "uid-a",
      status: "blocked",
      error: blocker,
      decksById: { remote: remoteDeck },
      cardsById: {},
    };

    const { result } = renderHook(useRemoteCollections);

    expect(result.current.status).toBe("blocked");
    expect(result.current.error).toBe(blocker);
    expect(result.current.decks).toEqual([remoteDeck]);
  });
});
