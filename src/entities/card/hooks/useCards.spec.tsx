import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { cardRemoteReadStore } from "../model/remoteReadStore";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";
import { createCard } from "@/test/factories";

type CardReadState = ReturnType<typeof cardRemoteReadStore.getState>;

const mocks = vi.hoisted(() => ({
  state: {
    uid: "uid-a",
    status: "ready",
    syncStatus: "synced",
    itemsById: {},
  } as Omit<CardReadState, "start" | "stop" | "retry">,
  retry: vi.fn(),
}));

vi.mock("../model/remoteReadStore", () => ({
  cardRemoteReadStore: {
    subscribe: () => () => undefined,
    getState: () => Object.assign(mocks.state, { retry: mocks.retry }),
    getInitialState: () => Object.assign(mocks.state, { retry: mocks.retry }),
  },
}));

import { selectCardsForDeck, selectTagsForDeck, useCards } from "../index";

const authenticatedWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid="uid-a">{children}</RemoteReadScopeProvider>
);
const signedOutWrapper = ({ children }: PropsWithChildren) => (
  <RemoteReadScopeProvider uid={null}>{children}</RemoteReadScopeProvider>
);

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

    const { result } = renderHook(useCards, { wrapper: authenticatedWrapper });

    expect(result.current.cardsById[first.id]).toEqual(first);
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

    const { result } = renderHook(useCards, { wrapper: authenticatedWrapper });
    void result.current.retry();

    expect(result.current.cards).toEqual([card]);
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledOnce();
  });

  it("hides Card data while the App scope expects another UID", () => {
    const card = createCard({ id: "card" });
    mocks.state = { uid: "uid-b", status: "ready", syncStatus: "synced", itemsById: { [card.id]: card } };

    const { result } = renderHook(useCards, { wrapper: authenticatedWrapper });

    expect(result.current.cardsById).toEqual({});
    expect(result.current.cards).toEqual([]);
    expect(result.current.status).toBe("loading");
    expect(result.current.syncStatus).toBeUndefined();
  });

  it("hides Card data immediately when the App scope is signed out", () => {
    const card = createCard({ id: "card" });
    mocks.state = { uid: "uid-a", status: "ready", syncStatus: "synced", itemsById: { [card.id]: card } };

    const { result } = renderHook(useCards, { wrapper: signedOutWrapper });

    expect(result.current.cards).toEqual([]);
    expect(result.current.status).toBe("idle");
  });
});
