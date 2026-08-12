import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Card } from "@/entities/card/model/card";
import type { RemoteReadStoreState } from "@/shared/lib/remote-read/createRemoteReadStore";
import { createCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    itemsById: {},
  } as Omit<RemoteReadStoreState<Card>, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("@/entities/card/model/remoteReadStore", () => ({
  cardRemoteReadStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { selectCardsForDeck, selectTagsForDeck, useCards } from "@/entities/card";

describe("Card remote hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = {
      uid: "uid-a",
      status: "ready",
      syncStatus: "synced",
      itemsById: {},
    };
  });

  it("exposes Card collection data without an auth or Deck dependency", () => {
    const first = createCard({ id: "first", deckId: "deck-a", tags: ["z", "a"] });
    const second = createCard({ id: "second", deckId: "deck-a", tags: ["a"] });
    const other = createCard({ id: "other", deckId: "deck-b", tags: ["other"] });
    mocks.state = {
      ...mocks.state,
      itemsById: { [first.id]: first, [second.id]: second, [other.id]: other, missing: undefined },
    };

    const { result } = renderHook(useCards);

    expect(result.current.cardsById[first.id]).toBe(first);
    expect(result.current.cards).toEqual([first, second, other]);
    expect(selectCardsForDeck(result.current.cards, "deck-a")).toEqual([first, second]);
    expect(selectTagsForDeck(result.current.cards, "deck-a")).toEqual(["a", "z"]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("preserves Card data and retry in a terminal state", () => {
    const error = new Error("terminal");
    const card = createCard({ id: "card" });
    mocks.state = { uid: "uid-a", status: "error", error, itemsById: { [card.id]: card } };

    const { result } = renderHook(useCards);
    void result.current.retry();

    expect(result.current.cards).toEqual([card]);
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledOnce();
  });
});
