import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createDeck } from "@/test/factories";
import { useDeck, useDecks } from "./hooks";
import { clearRemoteDecks, deckStore, replaceRemoteDecks } from "./store";

const useMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
  deckStore.persist.setOptions({ storage: createJSONStorage(() => storage) });
  return storage;
};

describe("Deck store", () => {
  beforeEach(() => {
    useMemoryStorage();
    deckStore.setState({ remoteDecks: [], localDecks: [] });
  });

  it("replaces and clears only the remote Deck collection", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createDeck({ id: "local" });
    deckStore.setState({ localDecks: [localDeck] });

    replaceRemoteDecks([remoteDeck]);
    expect(deckStore.getState()).toEqual({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    clearRemoteDecks();
    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
  });

  it("exposes combined collection and individual Deck selectors", () => {
    const remoteDeck = createDeck({ id: "remote" });
    const localDeck = createDeck({ id: "local" });
    deckStore.setState({ remoteDecks: [remoteDeck], localDecks: [localDeck] });

    expect(renderHook(useDecks).result.current).toEqual([remoteDeck, localDeck]);
    expect(renderHook(() => useDeck("remote")).result.current).toEqual(remoteDeck);
    expect(renderHook(() => useDeck("local")).result.current).toEqual(localDeck);
    expect(renderHook(() => useDeck("missing")).result.current).toBeUndefined();
  });

  it("hydrates validated local Decks without restoring remote state", async () => {
    const localDeck = createDeck({ id: "local", localMode: true });
    useMemoryStorage({
      "tango-local-decks": JSON.stringify({
        state: { localDecks: [localDeck], remoteDecks: [createDeck()] },
        version: 0,
      }),
    });

    await deckStore.persist.rehydrate();

    expect(deckStore.getState()).toEqual({ remoteDecks: [], localDecks: [localDeck] });
  });

  it("rejects invalid persisted Decks", async () => {
    useMemoryStorage({
      "tango-local-decks": JSON.stringify({ state: { localDecks: [{ id: "invalid" }] }, version: 0 }),
    });

    await deckStore.persist.rehydrate();

    expect(deckStore.getState().localDecks).toEqual([]);
  });
});
