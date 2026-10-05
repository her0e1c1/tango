import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { useCard, useCards, useCardsByDeckId } from "./hooks";

describe("Card visibility hooks", () => {
  beforeEach(() => {
    replaceRemoteCards([]);
    replaceRemoteDecks([]);
  });

  afterEach(() => {
    replaceRemoteCards([]);
    replaceRemoteDecks([]);
  });

  it("UNIT-STORE-CARD-03 updates Card references when the available Deck or owner changes", () => {
    const cardA = createCard({ id: "card-a", deckId: "deck-x", uid: "user-a", tags: ["z", "a"] });
    const cardB = createCard({ id: "card-b", deckId: "deck-x", uid: "user-b", tags: ["foreign"] });
    const cardC = createCard({ id: "card-c", deckId: "deck-y", uid: "user-a", tags: ["orphan"] });
    replaceRemoteCards([cardC, cardB, cardA]);
    const { result } = renderHook(() => ({
      cards: useCards(),
      cardA: useCard(cardA.id),
      cardB: useCard(cardB.id),
      cardC: useCard(cardC.id),
      deckX: useCardsByDeckId("deck-x"),
      deckY: useCardsByDeckId("deck-y"),
    }));

    const visibilityCases = [
      {
        decks: [createDeck({ id: "deck-x", uid: "user-a" })],
        cards: [cardA],
        cardA,
        cardB: undefined,
        tags: ["a", "z"],
      },
      {
        decks: [createDeck({ id: "deck-x", uid: "user-b" })],
        cards: [cardB],
        cardA: undefined,
        cardB,
        tags: ["foreign"],
      },
      { decks: [], cards: [], cardA: undefined, cardB: undefined, tags: [] },
    ];

    for (const scenario of visibilityCases) {
      act(() => replaceRemoteDecks(scenario.decks));

      expect(result.current).toEqual({
        cards: scenario.cards,
        cardA: scenario.cardA,
        cardB: scenario.cardB,
        cardC: undefined,
        deckX: { cards: scenario.cards, tags: scenario.tags },
        deckY: { cards: [], tags: [] },
      });
    }
  });
});
