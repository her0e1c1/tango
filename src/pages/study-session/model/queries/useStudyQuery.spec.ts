import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

import type { Card } from "@/entities/card";
import { clearStudySessions, getStudySession } from "@/entities/study-session";
import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks, restoreStudySession } from "@/test/utils/entityFixtures";
import { useStudyQuery } from "./useStudyQuery";

describe("scoped Study Cards [STUDY-SESSION-03]", () => {
  const deck = createDeck({ id: "deck" });
  const target = createCard({ id: "target", deckId: deck.id });
  const other = createCard({ id: "other", deckId: "other-deck", frontText: "other Deck" });
  const sibling = createCard({ id: "sibling", deckId: deck.id, frontText: "same Deck" });

  beforeEach(() => {
    // Given: A valid resumable Session targets a Card in the first visible Deck.
    clearStudySessions();
    replaceRemoteCards([]);
    replaceRemoteDecks([deck, createDeck({ id: other.deckId })]);
    restoreStudySession({
      sessionId: "session",
      deckId: deck.id,
      cardOrderIds: [target.id],
      currentIndex: 0,
      lastStudiedAt: 1,
      remote: { uid: deck.uid, startedAt: 1 },
    });
  });

  afterEach(() => {
    clearStudySessions();
    replaceRemoteCards([]);
    replaceRemoteDecks([]);
  });

  it.each<{ name: string; cards: Card[]; status: string; scoped: Card[] }>([
    { name: "empty cache", cards: [], status: "preparing", scoped: [] },
    { name: "another visible Deck only", cards: [other], status: "invalid", scoped: [] },
    { name: "same-Deck sibling only", cards: [sibling], status: "invalid", scoped: [sibling] },
    { name: "unavailable Deck only", cards: [{ ...other, deckId: "hidden" }], status: "preparing", scoped: [] },
    { name: "foreign owner only", cards: [{ ...target, uid: "foreign" }], status: "preparing", scoped: [] },
    { name: "target and another Deck", cards: [target, other], status: "studying", scoped: [target] },
  ])("preserves the existing status with $name", ({ cards, status, scoped }) => {
    // Given: Acquired Cards have the stated visibility while the Session is retained.
    replaceRemoteCards(cards);
    const session = getStudySession(deck.id);

    // When: Study reads the current Deck's Cards.
    const { result } = renderHook(() => useStudyQuery(deck.id));

    // Then: Card data is Deck-scoped and the pre-existing waiting/unavailable decision is preserved.
    expect(result.current.cards).toEqual(scoped);
    expect(result.current.status).toBe(status);
    expect(getStudySession(deck.id)).toEqual(session);
  });

  it("keeps the scoped Cards stable when another Deck's content changes", () => {
    // Given: The target and an unrelated Card are available in different visible Decks.
    replaceRemoteCards([target, other]);
    const { result } = renderHook(() => useStudyQuery(deck.id));
    const initialCards = result.current.cards;

    // When: Another Deck's acquired Card content changes.
    act(() => replaceRemoteCards([target, { ...other, frontText: "edited elsewhere" }]));

    // Then: Study retains its target and scoped Card collection.
    expect(result.current.status).toBe("studying");
    expect(result.current.cards).toEqual([target]);
    expect(result.current.cards).toBe(initialCards);
  });
});
