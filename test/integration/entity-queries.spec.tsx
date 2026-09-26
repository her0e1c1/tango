import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { clearRemoteCards, findCardsByDeckId, getCards, useCards } from "@/entities/card";
import { clearRemoteDecks } from "@/entities/deck";
import { requestDeckDeletion } from "@/features/deck-deletion";
import { createCard, createDeck } from "@/test/factories";
import { replaceRemoteCards, replaceRemoteDecks } from "@/test/utils/entityFixtures";

vi.mock("@/shared/firebase", () => ({ auth: {}, db: {} }));

beforeEach(() => {
  clearRemoteCards();
  clearRemoteDecks();
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
