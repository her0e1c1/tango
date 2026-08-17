/**
 * @file Verifies the "Query realtime subscriptions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delivers initial, update,
 * and delete snapshots without a cursor".
 */

import "@/test/initializeTestFirestore";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";

import { deleteCard, editCard, fetchCardReads, mutateCards, subscribeCards } from "@/entities/card";
import { createDeck, deleteDeck, editDeck, subscribeDecks } from "@/entities/deck";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { createCard, createDeck as createDeckFixture } from "@/test/factories";

vi.mock("@/shared/lib/currentTime", () => ({ getCurrentTimeMillis: vi.fn(() => 100) }));
vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe("Query realtime subscriptions", () => {
  beforeEach(() => {
    cardStore.setState({ remoteCards: [], localCards: [] });
    deckStore.setState({ remoteDecks: [], localDecks: [] });
  });

  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it("fetches separated Card reads through the public read API", async () => {
    const uid = "uid";
    const deck = createDeckFixture({ id: crypto.randomUUID(), uid, name: "Fetched Deck" });
    const card = createCard({
      id: crypto.randomUUID(),
      deckId: deck.id,
      uid,
      frontText: "Fetched Card",
      score: 2,
      numberOfSeen: 3,
    });
    await createDeck(uid, deck);
    await mutateCards(uid, [{ kind: "create", card }]);

    const reads = await fetchCardReads(uid);

    expect(reads).toContainEqual({
      card: expect.objectContaining({ id: card.id, frontText: "Fetched Card" }),
      progress: expect.objectContaining({ cardId: card.id, score: 2, numberOfSeen: 3 }),
    });
  });

  it("delivers initial, update, and delete snapshots without a cursor", async () => {
    const uid = "uid";
    const errors: Error[] = [];
    const stopDecks = subscribeDecks(uid, (error) => errors.push(error));
    const stopCards = subscribeCards(uid, (error) => errors.push(error));

    try {
      const deck = createDeckFixture({ id: crypto.randomUUID(), uid });
      const card = createCard({ id: crypto.randomUUID(), deckId: deck.id, uid });
      await createDeck(uid, deck);
      await mutateCards(uid, [{ kind: "create", card }]);
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks).toContainEqual(expect.objectContaining({ id: deck.id }));
        expect(cardStore.getState().remoteCards).toContainEqual(expect.objectContaining({ id: card.id }));
      });

      await editDeck(uid, { ...deck, name: "Updated" });
      await editCard(uid, { ...card, frontText: "Updated" });
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks).toContainEqual(
          expect.objectContaining({ id: deck.id, name: "Updated" })
        );
        expect(cardStore.getState().remoteCards).toContainEqual(
          expect.objectContaining({ id: card.id, frontText: "Updated" })
        );
      });

      await deleteCard(uid, card);
      await deleteDeck(uid, deck);
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks.find((candidate) => candidate.id === deck.id)).toBeUndefined();
        expect(cardStore.getState().remoteCards.find((candidate) => candidate.id === card.id)).toBeUndefined();
      });
      expect(errors).toEqual([]);
    } finally {
      stopCards();
      stopDecks();
    }
  });

  it("stops changing stores after unsubscribe", async () => {
    const uid = "uid";
    const errors: Error[] = [];
    const stopDecks = subscribeDecks(uid, (error) => errors.push(error));
    const stopCards = subscribeCards(uid, (error) => errors.push(error));
    const deck = createDeckFixture({ id: crypto.randomUUID(), uid, name: "Before stop" });
    const card = createCard({ id: crypto.randomUUID(), deckId: deck.id, uid, frontText: "Before stop" });

    await createDeck(uid, deck);
    await mutateCards(uid, [{ kind: "create", card }]);
    await vi.waitFor(() => {
      expect(deckStore.getState().remoteDecks).toContainEqual(
        expect.objectContaining({ id: deck.id, name: "Before stop" })
      );
      expect(cardStore.getState().remoteCards).toContainEqual(
        expect.objectContaining({ id: card.id, frontText: "Before stop" })
      );
    });

    stopCards();
    stopDecks();
    await editDeck(uid, { ...deck, name: "After stop" });
    await editCard(uid, { ...card, frontText: "After stop" });

    expect(deckStore.getState().remoteDecks).toContainEqual(
      expect.objectContaining({ id: deck.id, name: "Before stop" })
    );
    expect(cardStore.getState().remoteCards).toContainEqual(
      expect.objectContaining({ id: card.id, frontText: "Before stop" })
    );
    expect(errors).toEqual([]);
  });
});
