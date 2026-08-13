/**
 * @file Verifies the "Query realtime subscriptions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delivers initial, update,
 * and delete snapshots without a cursor".
 */

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import type { RemoteSnapshot } from "@/shared/api";

import "@/test/initializeTestFirestore";
import { afterAll, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";

import * as cardAdapter from "@/entities/card/api/firestore";
import { subscribeCardReads } from "@/entities/card/api/subscribeCardReads";
import * as deckAdapter from "@/entities/deck/api/firestore";
import { subscribeDeckReads } from "@/entities/deck/api/subscribeDeckReads";
import { createCard, createDeck } from "@/test/factories";

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
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
    const stopDecks = subscribeDeckReads({
      uid: "uid",
      onSnapshot: (snapshot) => deckSnapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });
    const stopCards = subscribeCardReads({
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
      await deckAdapter.remove(deck.id);
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
