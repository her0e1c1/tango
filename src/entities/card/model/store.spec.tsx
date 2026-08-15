import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createCard } from "@/test/factories";
import { useCard, useCards, useCardsByDeckId } from "./hooks";
import {
  cardStore,
  clearRemoteCards,
  createLocalCard,
  deleteLocalCard,
  deleteLocalCardsByDeckId,
  editLocalCard,
  replaceRemoteCards,
} from "./store";

const cardInput = (id: string, deckId = "deck") => ({
  id,
  deckId,
  uid: "uid",
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: `key-${id}`,
});

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
    vi.useRealTimers();
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

  it("persists only local Cards", async () => {
    const storage = useMemoryStorage();
    const remoteCard = createCard({ id: "remote" });
    const localCard = createCard({ id: "local" });
    cardStore.setState({ remoteCards: [remoteCard], localCards: [localCard] });

    const persistedValue = (await storage.getItem("tango-local-cards")) ?? "{}";
    expect(JSON.parse(persistedValue)).toEqual({
      state: { localCards: [localCard] },
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
        state: { localCards: [{ ...createCard(), frontText: 42 }] },
        version: 1,
      }),
    });

    await cardStore.persist.rehydrate();

    expect(cardStore.getState().localCards).toEqual([]);
  });

  it("creates, edits, and deletes a local Card synchronously", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(10).mockReturnValueOnce(20);
    const createdCard = createLocalCard(cardInput("local"));

    expect(createdCard).toEqual(expect.objectContaining({ id: "local", createdAt: 10, updatedAt: 10 }));

    const updatedCard = editLocalCard({ id: "local", uid: "uid", frontText: "updated" });
    expect(updatedCard).toEqual(expect.objectContaining({ frontText: "updated", createdAt: 10, updatedAt: 20 }));

    deleteLocalCard("local");
    expect(cardStore.getState().localCards).toEqual([]);
  });

  it("deletes local Cards by Deck", () => {
    createLocalCard(cardInput("first", "deck-a"));
    createLocalCard(cardInput("second", "deck-b"));

    deleteLocalCardsByDeckId("deck-a");

    expect(cardStore.getState().localCards.map(({ id }) => id)).toEqual(["second"]);
  });
});
