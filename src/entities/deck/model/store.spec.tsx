import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createDeck, createLocalDeck as createLocalDeckFixture } from "@/test/factories";
import { useDeck, useDecks } from "./hooks";
import { toDeckView } from "./rules";
import {
  clearRemoteDecks,
  createLocalDeck,
  deckStore,
  deleteLocalDeck,
  editLocalDeck,
  replaceRemoteDecks,
} from "./store";

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
  deckStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("Deck store", () => {
  beforeEach(() => {
    useMemoryStorage();
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    vi.useRealTimers();
  });

  it("replaces and clears only the remote Deck collection", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createLocalDeckFixture({ id: "local" });
    deckStore.setState({ localDecks: [localDeck] });

    replaceRemoteDecks([remoteDeck]);
    expect(deckStore.getState()).toEqual({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    clearRemoteDecks();
    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
  });

  it("exposes combined collection and individual Deck selectors", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createLocalDeckFixture({ id: "local" });
    deckStore.setState({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    expect(renderHook(useDecks).result.current).toEqual([toDeckView(remoteDeck), toDeckView(localDeck)]);
    expect(renderHook(() => useDeck("remote")).result.current).toEqual(toDeckView(remoteDeck));
    expect(renderHook(() => useDeck("local")).result.current).toEqual(toDeckView(localDeck));
    expect(renderHook(() => useDeck("missing")).result.current).toBeUndefined();
  });

  it("persists only local Decks and restores them after hydration", async () => {
    const storage = useMemoryStorage();
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createLocalDeckFixture({ id: "local" });
    deckStore.setState({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    const persistedValue = (await storage.getItem("tango-local-decks")) ?? "{}";
    expect(JSON.parse(persistedValue)).toEqual({
      state: { localDecks: [localDeck] },
      version: 1,
    });

    deckStore.setState({ remoteDecks: [], localDecks: [] });
    useMemoryStorage({ "tango-local-decks": persistedValue });
    await deckStore.persist.rehydrate();
    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
  });

  it("hydrates version 1 local Decks without retaining a UID", async () => {
    const localDeck = createLocalDeckFixture({ id: "persisted-local" });
    useMemoryStorage({
      "tango-local-decks": JSON.stringify({
        state: { localDecks: [{ ...localDeck, uid: "previous-user" }] },
        version: 1,
      }),
    });

    await deckStore.persist.rehydrate();

    expect(deckStore.getState().localDecks).toEqual([localDeck]);
    expect(deckStore.getState().localDecks[0]).not.toHaveProperty("uid");
  });

  it("rejects invalid persisted Decks", async () => {
    const invalidDeck = createDeck({ id: "remote-shaped", localMode: false });
    useMemoryStorage({
      "tango-local-decks": JSON.stringify({ state: { localDecks: [invalidDeck] }, version: 1 }),
    });

    await deckStore.persist.rehydrate();

    expect(deckStore.getState().localDecks).toEqual([]);
  });

  it("creates, edits, and deletes a local Deck synchronously", () => {
    vi.spyOn(Date, "now").mockReturnValueOnce(10).mockReturnValueOnce(20);
    const createdDeck = createLocalDeck({
      id: "local",
      name: "Local",
      url: "https://example.com/deck.csv",
      localMode: true,
    });

    expect(createdDeck).toEqual(
      expect.objectContaining({ id: "local", localMode: true, createdAt: 10, updatedAt: 10 })
    );
    expect(createdDeck).not.toHaveProperty("uid");

    const updatedDeck = editLocalDeck({ id: "local", name: "Renamed", url: null });
    expect(updatedDeck).toEqual(expect.objectContaining({ name: "Renamed", createdAt: 10, updatedAt: 20 }));
    expect(updatedDeck).not.toHaveProperty("url");

    deleteLocalDeck("local");
    expect(deckStore.getState().localDecks).toEqual([]);
  });
});
