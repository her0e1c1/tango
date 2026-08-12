import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Deck } from "@/entities/deck/model/deck";
import type { RemoteReadStoreState } from "@/shared/lib/remote-read/createRemoteReadStore";
import { createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    itemsById: {},
  } as Omit<RemoteReadStoreState<Deck>, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("@/entities/deck/model/remoteReadStore", () => ({
  deckRemoteReadStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { useDecks } from "@/entities/deck";

describe("Deck remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      itemsById: {},
    };
  });

  it("exposes Deck collection data without an auth or Card dependency", () => {
    const deck = createDeck({ id: "deck" });
    mocks.state = { ...mocks.state, itemsById: { [deck.id]: deck, missing: undefined } };

    const { result } = renderHook(useDecks);

    expect(result.current.decksById).toEqual({ [deck.id]: deck, missing: undefined });
    expect(result.current.decksById[deck.id]).toBe(deck);
    expect(result.current.decks).toEqual([deck]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("preserves Deck data and retry in a terminal state", () => {
    const error = new Error("terminal");
    const deck = createDeck({ id: "deck" });
    mocks.state = { uid: "uid-a", status: "blocked", error, itemsById: { [deck.id]: deck } };

    const { result } = renderHook(useDecks);
    void result.current.retry();

    expect(result.current.decks).toEqual([deck]);
    expect(result.current.status).toBe("blocked");
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledOnce();
  });
});
