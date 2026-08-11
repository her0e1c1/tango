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

import { selectCardsForDeck, selectTagsForDeck, useCards } from "@/entities/card";

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

  it("exposes Card collection data for pure selectors", () => {
    const first = createCard({ id: "first", deckId: "deck-a", tags: ["z", "a"] });
    const second = createCard({ id: "second", deckId: "deck-a", tags: ["a"] });
    const other = createCard({ id: "other", deckId: "deck-b", tags: ["other"] });
    mocks.state = {
      ...mocks.state,
      cardsById: { [first.id]: first, [second.id]: second, [other.id]: other, missing: undefined },
    };

    const { result } = renderHook(useCards);

    expect(result.current.cardsById[first.id]).toBe(first);
    expect(result.current.cards).toEqual([first, second, other]);
    expect(selectCardsForDeck(result.current.cards, "deck-a")).toEqual([first, second]);
    expect(selectTagsForDeck(result.current.cards, "deck-a")).toEqual(["a", "z"]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
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

    const { result } = renderHook(useCards);

    expect(result.current.cards).toEqual([]);
    expect(result.current.cardsById[card.id]).toBeUndefined();
    expect(result.current.status).toBe("loading");
  });
});
