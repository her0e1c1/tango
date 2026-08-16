import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { deleteCard, editCard, mutateCards, useCards } from "@/entities/card";
import { createDeck, deleteDeck, editDeck, useDecks } from "@/entities/deck";
import { clearStudySessions, getStudySession, startStudy } from "@/entities/study-session";
import { createLocalCard, createLocalDeck } from "@/test/factories";

vi.mock("@/shared/firebase", () => ({ db: {} }));

const studyOptions = { shuffled: false, maxNumberOfCardsToLearn: 0 };

describe("local Entity mutations", () => {
  afterEach(() => {
    clearStudySessions();
    localStorage.clear();
  });

  it("creates, edits, and deletes a Card through its local Deck", async () => {
    const deck = createLocalDeck({ id: "card-deck" });
    const card = createLocalCard({ id: "edited-card", deckId: deck.id });
    await createDeck("", deck);
    await mutateCards("", [{ kind: "create", card }]);

    await editCard("", { id: card.id, frontText: "Updated" });

    const editedCards = renderHook(() => useCards());
    expect(editedCards.result.current).toContainEqual(expect.objectContaining({ id: card.id, frontText: "Updated" }));
    editedCards.unmount();

    await deleteCard("", card);

    const remainingCards = renderHook(() => useCards());
    expect(remainingCards.result.current.find(({ id }) => id === card.id)).toBeUndefined();
    remainingCards.unmount();
    await deleteDeck("", deck);
  });

  it("deletes a local Deck with its Cards and study session without affecting other Decks", async () => {
    const deck = createLocalDeck({ id: "deleted-deck" });
    const otherDeck = createLocalDeck({ id: "kept-deck" });
    const card = createLocalCard({ id: "deleted-card", deckId: deck.id });
    const otherCard = createLocalCard({ id: "kept-card", deckId: otherDeck.id });
    await createDeck("", deck);
    await createDeck("", otherDeck);
    await mutateCards("", [
      { kind: "create", card },
      { kind: "create", card: otherCard },
    ]);
    startStudy(deck.id, [card], studyOptions);
    startStudy(otherDeck.id, [otherCard], studyOptions);

    await editDeck("", { id: deck.id, name: "Renamed" });
    await deleteDeck("", deck);

    const decks = renderHook(() => useDecks());
    const cards = renderHook(() => useCards());
    expect(decks.result.current.find(({ id }) => id === deck.id)).toBeUndefined();
    expect(cards.result.current.find(({ id }) => id === card.id)).toBeUndefined();
    expect(getStudySession(deck.id)).toBeUndefined();
    expect(decks.result.current).toContainEqual(expect.objectContaining({ id: otherDeck.id }));
    expect(cards.result.current).toContainEqual(expect.objectContaining({ id: otherCard.id }));
    expect(getStudySession(otherDeck.id)).toBeDefined();
    decks.unmount();
    cards.unmount();
    await deleteDeck("", otherDeck);
  });
});
