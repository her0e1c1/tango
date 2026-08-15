import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createDeck } from "@/test/factories";
import { useDeck, useDecks } from "./hooks";
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
    const localDeck = createDeck({ id: "local", localMode: true });
    deckStore.setState({ localDecks: [localDeck] });

    replaceRemoteDecks([remoteDeck]);
    expect(deckStore.getState()).toEqual({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    clearRemoteDecks();
    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
  });

  it("exposes combined collection and individual Deck selectors", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createDeck({ id: "local", localMode: true });
    deckStore.setState({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    expect(renderHook(useDecks).result.current).toEqual([remoteDeck, localDeck]);
    expect(renderHook(() => useDeck("remote")).result.current).toEqual(remoteDeck);
    expect(renderHook(() => useDeck("local")).result.current).toEqual(localDeck);
    expect(renderHook(() => useDeck("missing")).result.current).toBeUndefined();
  });

  it("persists only local Decks and restores them after hydration", async () => {
    const storage = useMemoryStorage();
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createDeck({ id: "local", localMode: true });
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
    const createdDeck = createLocalDeck({ id: "local", uid: "uid", name: "Local", localMode: true });

    expect(createdDeck).toEqual(
      expect.objectContaining({ id: "local", localMode: true, createdAt: 10, updatedAt: 10 })
    );

    const updatedDeck = editLocalDeck({ id: "local", name: "Renamed" });
    expect(updatedDeck).toEqual(expect.objectContaining({ name: "Renamed", createdAt: 10, updatedAt: 20 }));

    deleteLocalDeck("local");
    expect(deckStore.getState().localDecks).toEqual([]);
  });
});
