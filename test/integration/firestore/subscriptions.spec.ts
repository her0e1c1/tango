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

import { subscribeCardReads } from "@/entities/card/api/subscribeCardReads";
import { subscribeDeckReads } from "@/entities/deck/api/subscribeDeckReads";
import { createCard as createCardCommand } from "@/features/card/create";
import { deleteCard } from "@/features/card/delete/api/deleteCard";
import { editCard } from "@/features/card/edit";
import { createDeck as createDeckCommand } from "@/features/deck/create";
import { deleteDeck } from "@/features/deck/delete/api/deleteDeck";
import { editDeck } from "@/features/deck/edit/api/editDeck";
import { createCard, createDeck as createDeckFixture } from "@/test/factories";

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

      const deck = createDeckFixture({ id: "deck-id", uid: "uid" });
      const card = createCard({ id: "card-id", deckId: deck.id, uid: "uid" });
      await createDeckCommand("uid", deck);
      await createCardCommand("uid", card);
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

      await editDeck("uid", { ...deck, name: "Updated" });
      await editCard("uid", { ...card, frontText: "Updated" });
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

      await deleteCard("uid", card);
      await deleteDeck("uid", deck);
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
