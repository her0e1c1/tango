import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteStoreState } from "@/store/remoteStore";
import { createDeck } from "@/test/factories";

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

vi.mock("@/entities/session", () => ({
  useSession: () => ({ status: "authenticated", uid: mocks.uid, isAnonymous: true, displayName: null }),
}));
vi.mock("@/store/remoteStore", () => ({
  remoteStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { useDecks } from "@/entities/deck";

describe("Deck remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.uid = "uid-a";
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      decksById: {},
      cardsById: {},
    };
  });

  it("exposes Deck collection data", () => {
    const deck = createDeck({ id: "deck" });
    mocks.state = { ...mocks.state, decksById: { [deck.id]: deck, missing: undefined } };

    const { result } = renderHook(useDecks);

    expect(result.current.decksById).toEqual({ [deck.id]: deck, missing: undefined });
    expect(result.current.decksById[deck.id]).toBe(deck);
    expect(result.current.decks).toEqual([deck]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("preserves terminal state and retry without dropping Deck data", () => {
    const error = new Error("terminal");
    const deck = createDeck({ id: "deck" });
    mocks.state = {
      uid: "uid-a",
      status: "error",
      error,
      decksById: { [deck.id]: deck },
      cardsById: {},
    };

    const { result } = renderHook(useDecks);
    void result.current.retry();

    expect(result.current.decks).toEqual([deck]);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("hides Deck data until the authenticated and active UIDs match", () => {
    const deck = createDeck({ id: "deck" });
    mocks.state = {
      uid: "uid-b",
      status: "ready",
      syncStatus: "synced",
      decksById: { [deck.id]: deck },
      cardsById: {},
    };

    const { result } = renderHook(useDecks);

    expect(result.current.decks).toEqual([]);
    expect(result.current.decksById[deck.id]).toBeUndefined();
    expect(result.current.status).toBe("loading");
  });

  it("exposes persistent cache initialization failures as blocking state", () => {
    const blocker = new Error("another tab owns the cache");
    const deck = createDeck({ id: "deck" });
    mocks.state = {
      uid: "uid-a",
      status: "blocked",
      error: blocker,
      decksById: { [deck.id]: deck },
      cardsById: {},
    };

    const { result } = renderHook(useDecks);

    expect(result.current.status).toBe("blocked");
    expect(result.current.error).toBe(blocker);
    expect(result.current.decks).toEqual([deck]);
  });
});
