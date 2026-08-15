import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { createJSONStorage, type StateStorage } from "zustand/middleware";

import { createCard } from "@/test/factories";
import { useCard, useCards } from "./hooks";
import { cardStore, clearRemoteCards, replaceRemoteCards } from "./store";

const useMemoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (name) => values.get(name) ?? null,
    setItem: (name, value) => values.set(name, value),
    removeItem: (name) => values.delete(name),
  };
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

  it("hydrates validated local Cards without restoring remote state", async () => {
    const localCard = createCard({ id: "local", nextSeeingAt: new Date("2026-08-15T00:00:00Z") });
    useMemoryStorage({
      "tango-local-cards": JSON.stringify({
        state: { localCards: [localCard], remoteCards: [createCard()] },
        version: 0,
      }),
    });

    await cardStore.persist.rehydrate();

    expect(cardStore.getState().remoteCards).toEqual([]);
    expect(cardStore.getState().localCards).toEqual([localCard]);
  });

  it("rejects invalid persisted Cards", async () => {
    useMemoryStorage({
      "tango-local-cards": JSON.stringify({ state: { localCards: [{ id: "invalid" }] }, version: 0 }),
    });

    await cardStore.persist.rehydrate();

    expect(cardStore.getState().localCards).toEqual([]);
  });
});
