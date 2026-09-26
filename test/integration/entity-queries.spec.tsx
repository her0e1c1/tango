import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateFsrsState, clearRemoteCards, findCardsByDeckId, getCards, useCards } from "@/entities/card";
import { clearRemoteDecks } from "@/entities/deck";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";
import { requestDeckDeletion } from "@/features/deck-deletion";
import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

beforeEach(() => {
  clearRemoteCards();
  clearRemoteDecks();
});

describe("Study selection queries [STUDY-SESSION-01 STUDY-SESSION-02]", () => {
  it("reads current visible cards for the deck while respecting the draft and deadline", () => {
    const deck = createDeck({ selectedTags: ["saved"] });
    const otherDeck = createDeck({ id: "other" });
    replaceRemoteDecks([deck, otherDeck]);
    const draft = { selectedTags: ["draft"], tagAndFilter: false };
    const card = createCard({ tags: ["draft"] });
    const future = createCard({
      id: "future",
      tags: ["draft"],
      fsrs: { ...calculateFsrsState(null, "good", 0), dueAt: 2000 },
    });
    replaceRemoteCards([
      card,
      future,
      createCard({ id: "saved", tags: ["saved"] }),
      createCard({ id: "other-deck", deckId: otherDeck.id, tags: ["draft"] }),
      createCard({ id: "other-owner", uid: "other", tags: ["draft"] }),
    ]);

    expect(selectStudyCardsWithDeadline(deck.id, draft, true, 1000)).toEqual({
      cards: [card],
      nextDueAt: 2000,
    });
    expect(selectStudyCardsWithDeadline(deck.id, draft, true, 2000)).toEqual({
      cards: [card, future],
      nextDueAt: undefined,
    });
    expect(selectStudyCardsWithDeadline(deck.id, draft, false, 1000).cards).toEqual([card, future]);

    replaceRemoteCards([future]);

    expect(selectStudyCardsWithDeadline(deck.id, draft, true, 1000)).toEqual({
      cards: [],
      nextDueAt: 2000,
    });
  });
});

afterEach(() => cleanup());

describe("Entity query consumers [CARD-VIEW-01 DECK-MANAGEMENT-02]", () => {
  it("updates subscribed cards when only the visible deck changes", () => {
    const deck = createDeck();
    const card = createCard();
    replaceRemoteDecks([deck]);
    replaceRemoteCards([card]);
    const { result } = renderHook(() => useCards());

    expect(result.current).toEqual([card]);

    act(() => clearRemoteDecks());

    expect(result.current).toEqual([]);
    expect(getCards()).toEqual([]);
    expect(findCardsByDeckId(deck.id)).toEqual([]);

    act(() => replaceRemoteDecks([deck]));

    expect(result.current).toEqual([card]);
    expect(findCardsByDeckId(deck.id)).toEqual([card]);
  });

  it("prepares deletion from the current deck and its visible cards", () => {
    const deck = createDeck({ name: "Original name" });
    const card = createCard();
    replaceRemoteDecks([deck]);
    replaceRemoteCards([card]);
    const updatedDeck = { ...deck, name: "Updated name" };
    replaceRemoteDecks([updatedDeck]);
    replaceRemoteCards([
      card,
      createCard({ id: "second" }),
      createCard({ id: "other-owner", uid: "other" }),
      createCard({ id: "other-deck", deckId: "other" }),
    ]);
    const setTarget = vi.fn();

    requestDeckDeletion(deck.id, { pending: false, setTarget });

    expect(setTarget).toHaveBeenCalledWith({ deck: updatedDeck, cardCount: 2 });
    expect(getCards()).toEqual([card, createCard({ id: "second" })]);
  });
});
