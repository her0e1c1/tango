/**
 * @file Verifies the "useRemoteCollections" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "returns RemoteStore data
 * as the only Deck and Card read model", "exposes terminal state and Retry without dropping data",
 * "does not expose Store data until authenticated and active UIDs match".
 */

import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteState } from "@/store/remoteStore";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    decksById: {},
    cardsById: {},
  } as RemoteState,
  blocker: undefined as Error | undefined,
  retry: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } }),
}));
vi.mock("@/query/reads/remoteReadSession", () => ({
  subscribeRemoteReadState: () => () => undefined,
  subscribeRemoteReadBlocker: () => () => undefined,
  getRemoteReadState: () => mocks.state,
  retryRemoteReads: mocks.retry,
  getRemoteReadBlocker: () => mocks.blocker,
}));

import { useRemoteCollections } from "@/query/useRemoteCollections";

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
    mocks.blocker = undefined;
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
    expect(result.current.filteredCardsByDeckId(freshRemote.id, createConfig())).toEqual([freshRemoteCard]);
    expect(result.current.tagsByDeckId(freshRemote.id)).toEqual(["a", "z"]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
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
    expect(result.current.retry).toBe(mocks.retry);
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
    mocks.blocker = blocker;
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: { remote: remoteDeck },
      cardsById: {},
    };

    const { result } = renderHook(useRemoteCollections);

    expect(result.current.status).toBe("blocked");
    expect(result.current.error).toBe(blocker);
    expect(result.current.decks).toEqual([remoteDeck]);
  });
});
