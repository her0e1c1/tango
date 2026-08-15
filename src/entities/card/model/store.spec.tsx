import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { createCard } from "@/test/factories";
import { useCard, useCards, useCardsByDeckId } from "./hooks";
import { cardStore, clearRemoteCards, replaceRemoteCards } from "./store";

describe("Card store", () => {
  beforeEach(() => cardStore.setState({ remoteCards: [], localCards: [] }));

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
});
