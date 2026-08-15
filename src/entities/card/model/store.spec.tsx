import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createCard } from "@/test/factories";
import { useCard, useCards, useCardsByDeckId } from "./hooks";
import { cardStore, clearRemoteCards, replaceRemoteCards } from "./store";

const createMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
};

const useMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const storage = createMemoryStorage(initial);
  cardStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("Card store", () => {
  beforeEach(() => {
    useMemoryStorage();
    cardStore.setState({ remoteCards: [], localCards: [] });
  });

  it("replaces and clears only the remote Card collection", () => {
    const remoteCard = createCard({ id: "remote" });
    const localCard = createCard({ id: "local" });
    cardStore.setState({ localCards: [localCard] });

    replaceRemoteCards([remoteCard]);
    expect(cardStore.getState()).toEqual({ remoteCards: [remoteCard], localCards: [localCard] });

    clearRemoteCards();
    expect(cardStore.getState()).toEqual({ remoteCards: [], localCards: [localCard] });
  });

  it("exposes combined collection and individual Card selectors", () => {
    const remoteCard = createCard({ id: "remote" });
    const localCard = createCard({ id: "local" });
    cardStore.setState({ remoteCards: [remoteCard], localCards: [localCard] });

    expect(renderHook(useCards).result.current).toEqual([remoteCard, localCard]);
    expect(renderHook(() => useCard("remote")).result.current).toEqual(remoteCard);
    expect(renderHook(() => useCard("local")).result.current).toEqual(localCard);
    expect(renderHook(() => useCard("missing")).result.current).toBeUndefined();
  });

  it("selects cards and tags for a deck", () => {
    const remoteCard = createCard({ id: "remote", deckId: "deck-a", tags: ["verb", "n5"] });
    const localCard = createCard({ id: "local", deckId: "deck-a", tags: ["n5", "kanji"] });
    const otherCard = createCard({ id: "other", deckId: "deck-b", tags: ["other"] });
    cardStore.setState({ remoteCards: [remoteCard, otherCard], localCards: [localCard] });

    expect(renderHook(() => useCardsByDeckId("deck-a")).result.current).toEqual({
      cards: [remoteCard, localCard],
      tags: ["kanji", "n5", "verb"],
    });
  });

  it("persists only local Cards and restores dates after hydration", async () => {
    const storage = useMemoryStorage();
    const remoteCard = createCard({ id: "remote" });
    const localCard = createCard({ id: "local", nextSeeingAt: new Date(1_000) });
    cardStore.setState({ remoteCards: [remoteCard], localCards: [localCard] });

    const persistedValue = (await storage.getItem("tango-local-cards")) ?? "{}";
    expect(JSON.parse(persistedValue)).toEqual({
      state: { localCards: [{ ...localCard, nextSeeingAt: new Date(1_000).toISOString() }] },
      version: 1,
    });

    cardStore.setState({ remoteCards: [], localCards: [] });
    useMemoryStorage({ "tango-local-cards": persistedValue });
    await cardStore.persist.rehydrate();
    expect(cardStore.getState()).toEqual({ remoteCards: [], localCards: [localCard] });
  });

  it("rejects invalid persisted Cards", async () => {
    useMemoryStorage({
      "tango-local-cards": JSON.stringify({
        state: { localCards: [{ ...createCard(), nextSeeingAt: "invalid" }] },
        version: 1,
      }),
    });

    await cardStore.persist.rehydrate();

    expect(cardStore.getState().localCards).toEqual([]);
  });
});
