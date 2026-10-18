/**
 * @file Verifies the "Query realtime subscriptions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delivers initial, update,
 * and delete snapshots without a cursor".
 */

import "@/test/initializeTestFirestore";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";

import { createCard as createCardCommand, deleteCard, editCard, subscribeCards } from "@/entities/card";
import { createDeck, deleteDeck, editDeck, subscribeDecks } from "@/entities/deck";
import { cardStore } from "@/entities/card/model/store";
import { deckStore } from "@/entities/deck/model/store";
import { createCard, createDeck as createDeckFixture, createRemoteDeckInput } from "@/test/factories";

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

describe("Query realtime subscriptions", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    cardStore.setState({ cardsById: {} });
    deckStore.setState({ remoteDecks: [] });
  });

  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it("[FIRESTORE-SUBSCRIPTIONS-01] loads Card content from the initial snapshot", async () => {
    // Given: Prepare `uid`, `deck`, `card` and any shared test state below.
    const uid = "uid";
    const deck = createDeckFixture({ id: crypto.randomUUID(), uid, name: "Fetched Deck" });
    const card = createCard({
      id: crypto.randomUUID(),
      deckId: deck.id,
      uid,
      frontText: "Fetched Card",
    });
    await createDeck(uid, createRemoteDeckInput({ id: deck.id, name: deck.name }));
    deckStore.setState({ remoteDecks: [deck] });
    await createCardCommand(uid, card);

    const onError = vi.fn();
    // When: Subscribe to the prepared owner's Card content.
    const stopCards = subscribeCards(uid, onError);
    try {
      // Given: Use the current iteration or branch inputs from the enclosing case.
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => {
        expect(Object.values(cardStore.getState().cardsById)).toContainEqual(
          expect.objectContaining({ id: card.id, frontText: "Fetched Card" })
        );
      });
      expect(onError).not.toHaveBeenCalled();
    } finally {
      stopCards();
    }
  });

  it("[FIRESTORE-SUBSCRIPTIONS-02] delivers initial, update, and delete snapshots without a cursor", async () => {
    // Given: Prepare `uid`, `errors`, `stopDecks` and any shared test state below.
    const uid = "uid";
    const errors: Error[] = [];
    const stopDecks = subscribeDecks(uid, (error) => errors.push(error));
    const stopCards = subscribeCards(uid, (error) => errors.push(error));

    try {
      // Given: Prepare `deck`, `card` and any shared test state below.
      const deck = createDeckFixture({ id: crypto.randomUUID(), uid });
      const card = createCard({ id: crypto.randomUUID(), deckId: deck.id, uid });
      // When: Exercise `createDeck` with the prepared inputs.
      await createDeck(uid, createRemoteDeckInput({ id: deck.id, name: deck.name }));
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks).toContainEqual(expect.objectContaining({ id: deck.id }));
      });
      // When: Exercise `createCardCommand` with the prepared inputs.
      await createCardCommand(uid, card);
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => {
        expect(Object.values(cardStore.getState().cardsById)).toContainEqual(expect.objectContaining({ id: card.id }));
      });

      // When: Exercise `editDeck` with the prepared inputs.
      await editDeck(uid, { ...deck, name: "Updated" });
      await editCard(uid, { ...card, frontText: "Updated" });
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks).toContainEqual(
          expect.objectContaining({ id: deck.id, name: "Updated" })
        );
        expect(Object.values(cardStore.getState().cardsById)).toContainEqual(
          expect.objectContaining({ id: card.id, frontText: "Updated" })
        );
      });

      // When: Exercise `deleteCard` with the prepared inputs.
      await deleteCard(uid, card.id);
      await deleteDeck(uid, deck.id);
      // Then: Verify the expected result in the assertions below.
      await vi.waitFor(() => {
        expect(deckStore.getState().remoteDecks.find((candidate) => candidate.id === deck.id)).toBeUndefined();
        expect(
          Object.values(cardStore.getState().cardsById).find((candidate) => candidate.id === card.id)
        ).toBeUndefined();
      });
      expect(errors).toEqual([]);
    } finally {
      stopCards();
      stopDecks();
    }
  });

  it("[FIRESTORE-SUBSCRIPTIONS-03] stops changing stores after unsubscribe", async () => {
    // Given: Prepare `uid`, `errors`, `stopDecks` and any shared test state below.
    const uid = "uid";
    const errors: Error[] = [];
    const stopDecks = subscribeDecks(uid, (error) => errors.push(error));
    const stopCards = subscribeCards(uid, (error) => errors.push(error));
    const deck = createDeckFixture({ id: crypto.randomUUID(), uid, name: "Before stop" });
    const card = createCard({ id: crypto.randomUUID(), deckId: deck.id, uid, frontText: "Before stop" });

    // When: Exercise `createDeck` with the prepared inputs.
    await createDeck(uid, createRemoteDeckInput({ id: deck.id, name: deck.name }));
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => {
      expect(deckStore.getState().remoteDecks).toContainEqual(
        expect.objectContaining({ id: deck.id, name: "Before stop" })
      );
    });
    // When: Exercise `createCardCommand` with the prepared inputs.
    await createCardCommand(uid, card);
    // Then: Verify the expected result in the assertions below.
    await vi.waitFor(() => {
      expect(Object.values(cardStore.getState().cardsById)).toContainEqual(
        expect.objectContaining({ id: card.id, frontText: "Before stop" })
      );
    });

    // When: Exercise `stopCards` with the prepared inputs.
    stopCards();
    stopDecks();
    await editDeck(uid, { ...deck, name: "After stop" });
    await editCard(uid, { ...card, frontText: "After stop" });

    // Then: Verify the expected result in the assertions below.
    expect(deckStore.getState().remoteDecks).toContainEqual(
      expect.objectContaining({ id: deck.id, name: "Before stop" })
    );
    expect(Object.values(cardStore.getState().cardsById)).toContainEqual(
      expect.objectContaining({ id: card.id, frontText: "Before stop" })
    );
    expect(errors).toEqual([]);
  });
});
