import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateFsrsState, clearRemoteCards, findCardsByDeckId, getCards, useCards } from "@/entities/card";
import { clearRemoteDecks } from "@/entities/deck";
import { updatePreferences } from "@/entities/preference";
import { selectStudyCardsWithDeadline } from "@/entities/study-session";
import { requestDeckDeletion } from "@/features/deck-deletion";
import { createCard, createDeck, createPreferences } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

beforeEach(() => {
  clearRemoteCards();
  clearRemoteDecks();
  updatePreferences(createPreferences({ study: { useCardInterval: true } }));
});

describe("Study selection queries [STUDY-SESSION-01 STUDY-SESSION-02]", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
  });
  afterEach(() => vi.useRealTimers());

  it("uses the latest saved deck filter when no draft is supplied", () => {
    const deck = createDeck({ selectedTags: ["first"] });
    const first = createCard({ id: "first", tags: ["first"] });
    const second = createCard({ id: "second", tags: ["second"] });
    replaceRemoteDecks([deck]);
    replaceRemoteCards([first, second]);

    expect(selectStudyCardsWithDeadline(deck.id).cards).toEqual([first]);

    replaceRemoteDecks([{ ...deck, selectedTags: ["second"] }]);

    expect(selectStudyCardsWithDeadline(deck.id).cards).toEqual([second]);

    clearRemoteDecks();

    expect(selectStudyCardsWithDeadline(deck.id)).toEqual({ cards: [], nextDueAt: undefined });
  });

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

    expect(selectStudyCardsWithDeadline(deck.id, draft)).toEqual({
      cards: [card],
      nextDueAt: 2000,
    });
    vi.setSystemTime(2000);
    expect(selectStudyCardsWithDeadline(deck.id, draft)).toEqual({
      cards: [card, future],
      nextDueAt: undefined,
    });
    vi.setSystemTime(1000);
    updatePreferences({ study: { useCardInterval: false } });
    expect(selectStudyCardsWithDeadline(deck.id, draft).cards).toEqual([card, future]);
    updatePreferences({ study: { useCardInterval: true } });

    replaceRemoteCards([future]);

    expect(selectStudyCardsWithDeadline(deck.id, draft)).toEqual({
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
