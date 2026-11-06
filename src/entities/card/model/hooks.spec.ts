import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";
import { useCard, useCards, useCardsByDeckId, useHasCards } from "./hooks";
import { applyCardChanges, clearRemoteCards } from "./store";

describe("Card visibility hooks [CARD-LIST-01 CARD-FILTER-02]", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    replaceRemoteCards([]);
    replaceRemoteDecks([]);
  });

  afterEach(() => {
    replaceRemoteCards([]);
    replaceRemoteDecks([]);
  });

  it("UNIT-STORE-CARD-03 updates Card references when the available Deck or owner changes", () => {
    // Given: Prepare `cardA`, `cardB`, `cardC` and any shared test state below.
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
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // When: Exercise `act` with the prepared inputs.
      act(() => replaceRemoteDecks(scenario.decks));

      // Then: Verify the expected result in the assertions below.
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

  it("#1821 updates only the changed Card and its Deck subscribers", () => {
    // Given: Two visible Decks contain distinct non-default content and tags.
    const cardA = createCard({ id: "card-a", deckId: "deck-a", tags: ["old"] });
    const sibling = createCard({ id: "sibling", deckId: "deck-a", frontText: "unchanged sibling" });
    const cardB = createCard({ id: "card-b", deckId: "deck-b", frontText: "unchanged B", tags: ["keep"] });
    replaceRemoteDecks([createDeck({ id: "deck-a" }), createDeck({ id: "deck-b" })]);
    applyCardChanges([sibling, cardB, cardA]);
    const { result: deckA } = renderHook(() => useCardsByDeckId("deck-a"));
    const deckBValues: unknown[] = [];
    const { result: deckB } = renderHook(() => {
      const value = useCardsByDeckId("deck-b");
      deckBValues.push(value);
      return value;
    });
    const siblingValues: unknown[] = [];
    const { result: siblingResult } = renderHook(() => {
      const value = useCard(sibling.id);
      siblingValues.push(value);
      return value;
    });
    const { result: cardResult } = renderHook(() => useCard(cardA.id));
    const { result: allCards } = renderHook(useCards);
    const previousDeckB = deckB.current;
    const deckBRenderCount = deckBValues.length;
    const siblingRenderCount = siblingValues.length;
    const edited = { ...cardA, frontText: "edited A", tags: ["z", "a", "z"] };

    // When: A Card's content changes in Deck A.
    act(() => applyCardChanges([edited]));

    // Then: A updates, while B and the other Card keep their values without rendering again.
    expect(deckA.current).toEqual({ cards: [edited, sibling], tags: ["a", "z"] });
    expect(cardResult.current).toEqual(edited);
    expect(allCards.current).toEqual([edited, cardB, sibling]);
    expect(deckB.current).toEqual({ cards: [cardB], tags: ["keep"] });
    expect(deckB.current).toBe(previousDeckB);
    expect(siblingResult.current).toEqual(sibling);
    expect(deckBValues).toHaveLength(deckBRenderCount);
    expect(siblingValues).toHaveLength(siblingRenderCount);
  });

  it("adds each Card once in deterministic order and collects only its Deck's tags", () => {
    // Given: Both Decks have Cards, with overlapping tags within Deck A.
    const cardA = createCard({ id: "a", deckId: "deck-a", tags: ["n5", "kanji"] });
    const cardZ = createCard({ id: "z", deckId: "deck-a", tags: ["kanji", "verb"] });
    const cardB = createCard({ id: "b", deckId: "deck-b", tags: ["other"] });
    replaceRemoteDecks([createDeck({ id: "deck-a" }), createDeck({ id: "deck-b" })]);
    applyCardChanges([cardZ, cardB]);
    const { result } = renderHook(() => useCardsByDeckId("deck-a"));

    // When: The same new Card occurs twice in one update.
    act(() => applyCardChanges([cardA, cardA]));

    // Then: The Deck has one copy per Card, in ID order, and sorted unique tags.
    expect(result.current).toEqual({ cards: [cardA, cardZ], tags: ["kanji", "n5", "verb"] });
  });

  it.each(["tombstone", "removed", "quarantined"] as const)(
    "removes a %s Card from its Deck and detail while preserving other Decks",
    (removal) => {
      // Given: Each visible Deck has one Card with distinct content.
      const cardA = createCard({ id: "a", deckId: "deck-a", frontText: "remove A", tags: ["remove"] });
      const cardB = createCard({ id: "b", deckId: "deck-b", frontText: "keep B", tags: ["keep"] });
      replaceRemoteDecks([createDeck({ id: "deck-a" }), createDeck({ id: "deck-b" })]);
      applyCardChanges([cardA, cardB]);
      const { result } = renderHook(() => ({
        deckA: useCardsByDeckId("deck-a"),
        deckB: useCardsByDeckId("deck-b"),
        card: useCard(cardA.id),
      }));

      // When: The Card is deleted, leaves the SDK result, or becomes unreadable.
      act(() => {
        if (removal === "tombstone") applyCardChanges([{ ...cardA, deletedAt: 1 }]);
        else if (removal === "removed") applyCardChanges([], { removedCardIds: [cardA.id] });
        else applyCardChanges([], { invalidCardIds: [cardA.id] });
      });

      // Then: Only Deck A loses its Card and tags.
      expect(result.current).toEqual({
        deckA: { cards: [], tags: [] },
        deckB: { cards: [cardB], tags: ["keep"] },
        card: undefined,
      });
    }
  );

  it("reindexes a changed Deck and clears previous memberships on reset", () => {
    // Given: A visible Card belongs to Deck A, while Deck B is empty.
    const card = createCard({ id: "card", deckId: "deck-a", tags: ["moving"] });
    replaceRemoteDecks([createDeck({ id: "deck-a" }), createDeck({ id: "deck-b" })]);
    applyCardChanges([card]);
    const { result, rerender } = renderHook(({ deckId }) => useCardsByDeckId(deckId), {
      initialProps: { deckId: "deck-a" },
    });
    const moved = { ...card, deckId: "deck-b" };

    // When: A later acquired value belongs to Deck B instead.
    act(() => applyCardChanges([moved]));

    // Then: A loses the Card and a mounted consumer can switch to B.
    expect(result.current).toEqual({ cards: [], tags: [] });
    rerender({ deckId: "deck-b" });
    expect(result.current).toEqual({ cards: [moved], tags: ["moving"] });

    // When: The account's acquired Cards are cleared, then a new value arrives.
    act(clearRemoteCards);
    // Then: The previous membership and tags are gone.
    expect(result.current).toEqual({ cards: [], tags: [] });
    // When: The same Card arrives again for A.
    act(() => applyCardChanges([card]));
    rerender({ deckId: "deck-a" });
    // Then: It is visible exactly once in its current Deck.
    expect(result.current).toEqual({ cards: [card], tags: ["moving"] });
  });

  it("UNIT-STORE-CARD-03 scopes the Card-availability hint to visible owners", () => {
    // Given: Only a foreign-owner Card exists in the visible Deck.
    const deck = createDeck({ id: "deck", uid: "owner" });
    const card = createCard({ id: "card", deckId: deck.id, uid: "foreign" });
    replaceRemoteDecks([deck]);
    applyCardChanges([card]);
    const { result } = renderHook(useHasCards);
    expect(result.current).toBe(false);

    // When: A matching-owner value is acquired.
    act(() => applyCardChanges([{ ...card, uid: deck.uid }]));
    // Then: The availability hint becomes true.
    expect(result.current).toBe(true);

    // When: The Deck becomes unavailable while the Card stays cached.
    act(() => replaceRemoteDecks([]));
    // Then: Hidden Cards do not count as available.
    expect(result.current).toBe(false);
  });
});
