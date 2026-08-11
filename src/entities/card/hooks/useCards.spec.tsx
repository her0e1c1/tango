import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RemoteStoreState } from "@/store/remoteStore";
import { createCard } from "@/test/factories";

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

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } }),
}));
vi.mock("@/store/remoteStore", () => ({
  remoteStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { useCard, useCards, useCardsByDeck, useTagsByDeck } from "@/entities/card";

describe("Card remote hooks", () => {
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

  it("exposes Card collection, lookup, Deck relation, and tag data", () => {
    const first = createCard({ id: "first", deckId: "deck-a", tags: ["z", "a"] });
    const second = createCard({ id: "second", deckId: "deck-a", tags: ["a"] });
    const other = createCard({ id: "other", deckId: "deck-b", tags: ["other"] });
    mocks.state = {
      ...mocks.state,
      cardsById: { [first.id]: first, [second.id]: second, [other.id]: other, missing: undefined },
    };

    const { result } = renderHook(() => ({
      collection: useCards(),
      item: useCard(first.id),
      relation: useCardsByDeck("deck-a"),
      tags: useTagsByDeck("deck-a"),
    }));

    expect(result.current.collection.cards).toEqual([first, second, other]);
    expect(result.current.collection.cardById(first.id)).toBe(first);
    expect(result.current.collection.cardsByDeckId("deck-a")).toEqual([first, second]);
    expect(result.current.item.card).toBe(first);
    expect(result.current.relation.cards).toEqual([first, second]);
    expect(result.current.tags.tags).toEqual(["a", "z"]);
    expect(result.current.collection.status).toBe("ready");
    expect(result.current.collection.syncStatus).toBe("synced");
  });

  it("hides Card data until the authenticated and active UIDs match", () => {
    const card = createCard({ id: "card" });
    mocks.state = {
      uid: "uid-b",
      status: "ready",
      syncStatus: "synced",
      decksById: {},
      cardsById: { [card.id]: card },
    };

    const { result } = renderHook(() => ({ collection: useCards(), item: useCard(card.id) }));

    expect(result.current.collection.cards).toEqual([]);
    expect(result.current.item.card).toBeUndefined();
    expect(result.current.collection.status).toBe("loading");
  });
});
