import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { useDeck, useDecks } from "./hooks";
import { clearRemoteDecks, deckStore, replaceRemoteDecks } from "./store";

describe("Deck store", () => {
  beforeEach(() => deckStore.setState({ remoteDecks: [], localDecks: [] }));

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
});
