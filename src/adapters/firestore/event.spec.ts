/** @file Verifies realtime subscriptions and controlled malformed-document failures. */

import "./init";
import { afterAll, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";
import { deleteDoc, doc, getFirestore, setDoc } from "firebase/firestore";

import * as cardAdapter from "@/adapters/firestore/card";
import * as deckAdapter from "@/adapters/firestore/deck";
import * as eventAdapter from "@/adapters/firestore/event";
import type { RemoteSnapshot } from "@/domain/remoteSnapshot";
import { createCard, createDeck } from "@/test/factories";

vi.mock("./documentMetadata", () => ({
  generateDeckId: vi.fn(() => "unused-deck-id"),
  generateCardId: vi.fn(() => "unused-card-id"),
  getTimestamp: vi.fn(() => 100),
}));

describe("Query realtime subscriptions", () => {
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it("delivers initial, add, update, and Card delete snapshots without a cursor", async () => {
    const deckSnapshots: RemoteSnapshot<Deck>[] = [];
    const cardSnapshots: RemoteSnapshot<Card>[] = [];
    const errors: Error[] = [];
    const stopDecks = eventAdapter.subscribeDeckReads({
      uid: "uid",
      onSnapshot: (snapshot) => deckSnapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });
    const stopCards = eventAdapter.subscribeCardReads({
      uid: "uid",
      onSnapshot: (snapshot) => cardSnapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });

    try {
      await vi.waitFor(() => {
        expect(deckSnapshots[0]).toMatchObject({ type: "replace" });
        expect(cardSnapshots[0]).toMatchObject({ type: "replace" });
      });

      const deck = createDeck({ id: "deck-id", uid: "uid" });
      const card = createCard({ id: "card-id", deckId: deck.id, uid: "uid" });
      await deckAdapter.create(deck);
      await cardAdapter.create(card);
      await vi.waitFor(() => {
        expect(
          deckSnapshots.some(
            (snapshot) => snapshot.type === "change" && snapshot.event.added.some((item) => item.id === deck.id)
          )
        ).toBe(true);
        expect(
          cardSnapshots.some(
            (snapshot) => snapshot.type === "change" && snapshot.event.added.some((item) => item.id === card.id)
          )
        ).toBe(true);
      });

      await deckAdapter.update({ ...deck, name: "Updated" });
      await cardAdapter.update({ ...card, frontText: "Updated" });
      await vi.waitFor(() => {
        expect(
          deckSnapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.modified[0]?.name === "Updated")
        ).toBe(true);
        expect(
          cardSnapshots.some(
            (snapshot) => snapshot.type === "change" && snapshot.event.modified[0]?.frontText === "Updated"
          )
        ).toBe(true);
      });

      await cardAdapter.remove(card.id);
      await vi.waitFor(() => {
        expect(
          cardSnapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.removed.includes(card.id))
        ).toBe(true);
      });
      expect(errors).toEqual([]);
    } finally {
      stopCards();
      stopDecks();
    }
  });

  it("reports malformed documents through onError without publishing them", async () => {
    const snapshots: RemoteSnapshot<Card>[] = [];
    const errors: Error[] = [];
    const deck = createDeck({ id: "validation-deck", uid: "uid" });
    await deckAdapter.create(deck);
    const stop = eventAdapter.subscribeCardReads({
      uid: "uid",
      onSnapshot: (snapshot) => snapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });
    const invalidCardId = "invalid-card";

    try {
      await vi.waitFor(() => expect(snapshots[0]).toMatchObject({ type: "replace" }));
      await setDoc(doc(getFirestore(), "card", invalidCardId), { uid: "uid", deckId: deck.id });

      await vi.waitFor(() => {
        expect(errors[0]).toMatchObject({
          name: "FirestoreDocumentValidationError",
          collection: "card",
          documentId: invalidCardId,
        });
      });
      expect(
        snapshots.some(
          (snapshot) =>
            (snapshot.type === "replace" && snapshot.items.some((item) => item.id === invalidCardId)) ||
            (snapshot.type === "change" && snapshot.event.added.some((item) => item.id === invalidCardId))
        )
      ).toBe(false);
    } finally {
      await deleteDoc(doc(getFirestore(), "card", invalidCardId));
      stop();
    }
  });
});
