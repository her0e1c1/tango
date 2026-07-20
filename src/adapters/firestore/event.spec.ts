/**
 * @file Verifies the "Query realtime subscriptions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delivers initial, update,
 * and delete snapshots without a cursor".
 */

import "./init";
import { afterAll, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";

import * as cardAdapter from "@/adapters/firestore/card";
import * as deckAdapter from "@/adapters/firestore/deck";
import * as eventAdapter from "@/adapters/firestore/event";
import type { RemoteSnapshot } from "@/store/remoteStore";
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

  it("delivers initial, update, and delete snapshots without a cursor", async () => {
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
      await deckAdapter.remove(deck.id, deck.uid);
      await vi.waitFor(() => {
        expect(
          deckSnapshots.some((snapshot) => snapshot.type === "change" && snapshot.event.removed.includes(deck.id))
        ).toBe(true);
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
});
