import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { deckStore } from "@/entities/deck/@x/card";
import { createCard, createDeck, createLocalCard as createLocalCardFixture } from "@/test/factories";
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

// Builds the minimal local Card creation input used by store scenarios.
const cardInput = (id: string, deckId = "deck") => ({
  id,
  deckId,
  frontText: "front",
  backText: "back",
  tags: [],
  uniqueKey: `key-${id}`,
});

// Creates a synchronous in-memory implementation of Zustand storage.
const createMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
};

// Replaces the Card store's persistence backend with isolated memory storage.
const useMemoryStorage = (initial: Record<string, string> = {}): StateStorage => {
  const storage = createMemoryStorage(initial);
  cardStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("Card store", () => {
  beforeEach(() => {
    useMemoryStorage();
    cardStore.setState({ remoteCards: [], localCards: [] });
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.useRealTimers();
  });

  it("replaces and clears only the remote Card collection", () => {
    const remoteCard = createCard({ id: "remote" });
    const localCard = createLocalCardFixture({ id: "local" });
    cardStore.setState({ localCards: [localCard] });

    replaceRemoteCards([remoteCard]);
    expect(cardStore.getState()).toEqual({ remoteCards: [remoteCard], localCards: [localCard] });

    clearRemoteCards();
    expect(cardStore.getState()).toEqual({ remoteCards: [], localCards: [localCard] });
  });

  it("exposes combined collection and individual Card selectors", () => {
    const remoteCard = createCard({ id: "remote" });
    const localCard = createLocalCardFixture({ id: "local" });
    cardStore.setState({ remoteCards: [remoteCard], localCards: [localCard] });

    expect(renderHook(useCards).result.current).toEqual([remoteCard, localCard]);
    expect(renderHook(() => useCard("remote")).result.current).toEqual(remoteCard);
    expect(renderHook(() => useCard("local")).result.current).toEqual(localCard);
    expect(renderHook(() => useCard("missing")).result.current).toBeUndefined();
  });

  it("shows only Cards from the visible migration and removes local duplicates", () => {
    const deck = createDeck({
      id: "deck",
      migration: { id: "active", revision: 1, fingerprint: "a".repeat(64) },
    });
    const activeCard = createCard({ id: "card", deckId: deck.id, migrationId: "active" });
    const staleCard = createCard({ id: "stale", deckId: deck.id, migrationId: "replaced" });
    const localDuplicate = createLocalCardFixture({ id: activeCard.id, deckId: deck.id });
    deckStore.setState({ remoteDecks: [deck] });
    cardStore.setState({ remoteCards: [activeCard, staleCard], localCards: [localDuplicate] });

    expect(renderHook(useCards).result.current).toEqual([activeCard]);
  });

  it("selects cards and tags for a deck", () => {
    const remoteCard = createCard({ id: "remote", deckId: "deck-a", tags: ["verb", "n5"] });
    const localCard = createLocalCardFixture({ id: "local", deckId: "deck-a", tags: ["n5", "kanji"] });
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
    const localCard = createLocalCardFixture({ id: "local", nextSeeingAt: new Date(1000) });
    cardStore.setState({ remoteCards: [remoteCard], localCards: [localCard] });

    const persistedValue = (await storage.getItem("tango-local-cards")) ?? "{}";
    expect(JSON.parse(persistedValue)).toEqual({
      state: { localCards: [{ ...localCard, nextSeeingAt: new Date(1000).toISOString() }] },
      version: 1,
    });

    cardStore.setState({ remoteCards: [], localCards: [] });
    useMemoryStorage({ "tango-local-cards": persistedValue });
    await cardStore.persist.rehydrate();
    expect(cardStore.getState()).toEqual({ remoteCards: [], localCards: [localCard] });
  });

  it("hydrates version 1 local Cards without retaining a UID", async () => {
    const localCard = createLocalCardFixture({ id: "persisted-local", nextSeeingAt: new Date(1000) });
    useMemoryStorage({
      "tango-local-cards": JSON.stringify({
        state: {
          localCards: [{ ...localCard, uid: "previous-user", nextSeeingAt: localCard.nextSeeingAt?.toISOString() }],
        },
        version: 1,
      }),
    });

    await cardStore.persist.rehydrate();

    expect(cardStore.getState().localCards).toEqual([localCard]);
    expect(cardStore.getState().localCards[0]).not.toHaveProperty("uid");
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

  it("creates, edits, and deletes a local Card synchronously", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(10).mockReturnValueOnce(20);
    const createdCard = createLocalCard(cardInput("local"));

    expect(createdCard).toEqual(expect.objectContaining({ id: "local", createdAt: 10, updatedAt: 10 }));

    expect(createdCard).not.toHaveProperty("uid");

    const updatedCard = editLocalCard({ id: "local", frontText: "updated" });
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
