import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { deleteCard, editCard, mutateCards, useCard, useCards } from "@/entities/card";
import { cardStore, findCardById, replaceRemoteCards } from "@/entities/card/model/store";
import { createDeck, deleteDeck, editDeck, useDeck, useDecks } from "@/entities/deck";
import { deckStore, findDeckById, replaceRemoteDecks } from "@/entities/deck/model/store";
import { editStudyProgress } from "@/entities/study-progress";
import { deleteLocalStudyProgresses, editLocalStudyProgress } from "@/entities/study-progress/model/store";
import { clearStudySessions, getStudySession, startStudy } from "@/entities/study-session";
import {
  createCard as createRemoteCardFixture,
  createDeck as createRemoteDeckFixture,
  createLocalCard,
  createLocalDeck,
} from "@/test/factories";

const remoteMocks = vi.hoisted(() => ({
  createRemoteCard: vi.fn(),
  createRemoteDeck: vi.fn(),
  deleteRemoteCard: vi.fn(),
  deleteRemoteDeck: vi.fn(),
  editRemoteCard: vi.fn(),
  editRemoteDeck: vi.fn(),
}));

vi.mock("@/shared/firebase", () => ({ db: {} }));
vi.mock("@/entities/card/api/firestore", () => ({
  createCard: remoteMocks.createRemoteCard,
  deleteCard: remoteMocks.deleteRemoteCard,
  editCard: remoteMocks.editRemoteCard,
  fetchCardReads: vi.fn().mockResolvedValue([]),
  subscribeCardReads: vi.fn(() => vi.fn()),
  subscribeCards: vi.fn(() => vi.fn()),
}));
vi.mock("@/entities/deck/api/firestore", () => ({
  createDeck: remoteMocks.createRemoteDeck,
  deleteDeck: remoteMocks.deleteRemoteDeck,
  editDeck: remoteMocks.editRemoteDeck,
  subscribeDecks: vi.fn(() => vi.fn()),
}));

const studyOptions = { shuffled: false, maxNumberOfCardsToLearn: 0 };

describe("local Entity mutations", () => {
  beforeEach(() => {
    remoteMocks.createRemoteCard.mockReset().mockResolvedValue(undefined);
    remoteMocks.createRemoteDeck.mockReset().mockResolvedValue(undefined);
    remoteMocks.deleteRemoteCard.mockReset().mockResolvedValue(undefined);
    remoteMocks.deleteRemoteDeck.mockReset().mockResolvedValue(undefined);
    remoteMocks.editRemoteCard.mockReset().mockResolvedValue(undefined);
    remoteMocks.editRemoteDeck.mockReset().mockResolvedValue(undefined);
  });

  afterEach(() => {
    clearStudySessions();
    deleteLocalStudyProgresses(["edited-card", "deleted-card", "kept-card", "retry-first", "retry-second"]);
    cardStore.setState({ remoteCards: [], localCards: [] });
    deckStore.setState({ remoteDecks: [], localDecks: [] });
    localStorage.clear();
  });

  it("creates, edits, and deletes a Card through its local Deck", async () => {
    const deck = createLocalDeck({ id: "card-deck" });
    const card = createLocalCard({ id: "edited-card", deckId: deck.id });
    await createDeck("", deck);
    await mutateCards("", [{ kind: "create", card }]);

    expect(editLocalStudyProgress({ cardId: card.id })).toEqual({ cardId: card.id, score: 0, numberOfSeen: 0 });

    await editCard("", { id: card.id, frontText: "Updated" });
    await editStudyProgress("", { cardId: card.id, score: 2, numberOfSeen: 3, nextSeeingAt: new Date(1000) });

    const editedCards = renderHook(() => useCards());
    expect(editedCards.result.current).toContainEqual(
      expect.objectContaining({
        id: card.id,
        frontText: "Updated",
        score: 2,
        numberOfSeen: 3,
        nextSeeingAt: new Date(1000),
      })
    );
    expect(editLocalStudyProgress({ cardId: card.id })).toEqual({
      cardId: card.id,
      score: 2,
      numberOfSeen: 3,
      nextSeeingAt: new Date(1000),
    });
    editedCards.unmount();

    await deleteCard("", card);

    const remainingCards = renderHook(() => useCards());
    expect(remainingCards.result.current.find(({ id }) => id === card.id)).toBeUndefined();
    expect(() => editLocalStudyProgress({ cardId: card.id })).toThrow(`Local StudyProgress "${card.id}" was not found`);
    remainingCards.unmount();
    await deleteDeck("", deck.id);
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
    await deleteDeck("", deck.id);

    const decks = renderHook(() => useDecks());
    const cards = renderHook(() => useCards());
    expect(decks.result.current.find(({ id }) => id === deck.id)).toBeUndefined();
    expect(cards.result.current.find(({ id }) => id === card.id)).toBeUndefined();
    expect(() => editLocalStudyProgress({ cardId: card.id })).toThrow(`Local StudyProgress "${card.id}" was not found`);
    expect(getStudySession(deck.id)).toBeUndefined();
    expect(decks.result.current).toContainEqual(expect.objectContaining({ id: otherDeck.id }));
    expect(cards.result.current).toContainEqual(expect.objectContaining({ id: otherCard.id }));
    expect(editLocalStudyProgress({ cardId: otherCard.id })).toEqual({
      cardId: otherCard.id,
      score: 0,
      numberOfSeen: 0,
    });
    expect(getStudySession(otherDeck.id)).toBeDefined();
    decks.unmount();
    cards.unmount();
    await deleteDeck("", otherDeck.id);
  });

  it("keeps a partially migrated local graph authoritative through reload and a successful retry", async () => {
    const uid = "google-user";
    const deck = createLocalDeck({ id: "retry-deck", name: "Local source" });
    const firstCard = createLocalCard({ id: "retry-first", deckId: deck.id, frontText: "Local first" });
    const secondCard = createLocalCard({ id: "retry-second", deckId: deck.id, frontText: "Local second" });
    await createDeck("", deck);
    await mutateCards("", [
      { kind: "create", card: firstCard },
      { kind: "create", card: secondCard },
    ]);
    remoteMocks.createRemoteCard
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("partial remote write"));

    await expect(editDeck(uid, { id: deck.id, name: "First sync", localMode: false })).rejects.toThrow(
      "partial remote write"
    );

    const partialRemoteDeck = createRemoteDeckFixture({ id: deck.id, uid, name: "Partial remote" });
    const partialRemoteCard = createRemoteCardFixture({
      id: firstCard.id,
      deckId: deck.id,
      uid,
      frontText: "Partial remote",
    });
    replaceRemoteDecks([partialRemoteDeck]);
    replaceRemoteCards([partialRemoteCard]);

    expect(renderHook(useDecks).result.current).toEqual([
      expect.objectContaining({ id: deck.id, localMode: true, name: "First sync" }),
    ]);
    expect(renderHook(useCards).result.current).toEqual([
      expect.objectContaining({ id: firstCard.id, frontText: "Local first" }),
      expect.objectContaining({ id: secondCard.id, frontText: "Local second" }),
    ]);
    expect(renderHook(() => useDeck(deck.id)).result.current).toEqual(
      expect.objectContaining({ localMode: true, name: "First sync" })
    );
    expect(renderHook(() => useCard(firstCard.id)).result.current).toEqual(
      expect.objectContaining({ frontText: "Local first" })
    );
    expect(findDeckById(deck.id)).toEqual(expect.objectContaining({ localMode: true }));
    expect(findCardById(firstCard.id)).toEqual(expect.objectContaining({ frontText: "Local first" }));

    const persistedDecks = localStorage.getItem("tango-local-decks");
    const persistedCards = localStorage.getItem("tango-local-cards");
    if (persistedDecks === null || persistedCards === null)
      throw new Error("Expected retryable local graph to persist");
    deckStore.setState({ localDecks: [] });
    cardStore.setState({ localCards: [] });
    localStorage.setItem("tango-local-decks", persistedDecks);
    localStorage.setItem("tango-local-cards", persistedCards);

    await Promise.all([deckStore.persist.rehydrate(), cardStore.persist.rehydrate()]);

    expect(renderHook(useDecks).result.current).toEqual([
      expect.objectContaining({ id: deck.id, localMode: true, name: "First sync" }),
    ]);
    expect(renderHook(useCards).result.current).toHaveLength(2);

    await editCard("", { id: firstCard.id, frontText: "Edited after failure" });
    await editStudyProgress("", { cardId: firstCard.id, score: 4 });
    const retryableFirstCard = findCardById(firstCard.id);
    expect(retryableFirstCard).toEqual(
      expect.objectContaining({ frontText: "Edited after failure", score: 4, numberOfSeen: 0 })
    );

    remoteMocks.createRemoteCard.mockClear();
    remoteMocks.createRemoteDeck.mockClear();
    await editDeck(uid, { id: deck.id, name: "Retry succeeded", localMode: false });

    expect(remoteMocks.createRemoteDeck).toHaveBeenCalledExactlyOnceWith(
      uid,
      expect.objectContaining({ id: deck.id, name: "Retry succeeded", localMode: false, uid })
    );
    expect(remoteMocks.createRemoteCard).toHaveBeenCalledWith(
      uid,
      expect.objectContaining({ id: firstCard.id, frontText: "Edited after failure", score: 4, uid })
    );

    replaceRemoteDecks([createRemoteDeckFixture({ id: deck.id, uid, name: "Retry succeeded" })]);
    replaceRemoteCards([
      createRemoteCardFixture({
        id: firstCard.id,
        deckId: deck.id,
        uid,
        frontText: "Edited after failure",
        score: 4,
      }),
      createRemoteCardFixture({ id: secondCard.id, deckId: deck.id, uid, frontText: secondCard.frontText }),
    ]);

    expect(renderHook(useDecks).result.current).toEqual([
      expect.objectContaining({ id: deck.id, localMode: false, name: "Retry succeeded" }),
    ]);
    expect(renderHook(useCards).result.current).toEqual([
      expect.objectContaining({ id: firstCard.id, uid, frontText: "Edited after failure", score: 4 }),
      expect.objectContaining({ id: secondCard.id, uid }),
    ]);
    expect(() => editLocalStudyProgress({ cardId: firstCard.id })).toThrow(
      `Local StudyProgress "${firstCard.id}" was not found`
    );
    expect(() => editLocalStudyProgress({ cardId: secondCard.id })).toThrow(
      `Local StudyProgress "${secondCard.id}" was not found`
    );
  });
});
