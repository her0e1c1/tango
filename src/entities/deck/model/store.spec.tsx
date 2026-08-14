import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createDeck } from "@/test/factories";
import { useDeck, useDecks } from "./hooks";
import { clearDecks, deckStore, replaceDecks } from "./store";

describe("Deck store", () => {
  beforeEach(clearDecks);

  it("replaces and clears the Deck collection", () => {
    const deck = createDeck({ id: "deck" });

    replaceDecks([deck]);
    expect(deckStore.getState().decks).toEqual([deck]);

    clearDecks();
    expect(deckStore.getState().decks).toEqual([]);
  });

  it("exposes collection and individual Deck selectors", () => {
    const deck = createDeck({ id: "deck" });
    replaceDecks([deck]);

    expect(renderHook(useDecks).result.current).toEqual([deck]);
    expect(renderHook(() => useDeck("deck")).result.current).toEqual(deck);
    expect(renderHook(() => useDeck("missing")).result.current).toBeUndefined();
  });
});
