/**
 * @file Verifies the "Query realtime subscriptions" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "delivers initial, update,
 * and delete snapshots without a cursor".
 */

import type { Card } from "@/entities/card";
import type { RemoteSnapshot } from "@/shared/api";

import "@/test/initializeTestFirestore";
import { afterAll, describe, expect, it, vi } from "vitest";
import { deleteApp, getApps } from "firebase/app";

import { createCard as createCardCommand } from "@/features/card/create";
import { deleteCard } from "@/features/card/delete/api/deleteCard";
import { editCard } from "@/features/card/edit";
import { subscribeCardReads } from "@/features/card/read/api/subscribeCardReads";
import { createDeck as createDeckCommand } from "@/features/deck/create";
import { deleteDeck } from "@/features/deck/delete/api/deleteDeck";
import { editDeck } from "@/features/deck/edit/api/editDeck";
import { subscribeDecks } from "@/app/providers/remote-read/deck";
import { deckStore } from "@/entities/deck/model/store";
import { createCard, createDeck as createDeckFixture } from "@/test/factories";

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getTimestamp: vi.fn(() => 100),
}));
vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe("Query realtime subscriptions", () => {
  afterAll(async () => {
    await Promise.all(getApps().map(deleteApp));
  });

  it("delivers initial, update, and delete snapshots without a cursor", async () => {
    const uid = "uid";
    const cardSnapshots: RemoteSnapshot<Card>[] = [];
    const errors: Error[] = [];
    const stopDecks = subscribeDecks(uid, (error) => errors.push(error));
    const stopCards = subscribeCardReads({
      uid,
      onSnapshot: (snapshot) => cardSnapshots.push(snapshot),
      onError: (error) => errors.push(error),
    });

    try {
      const deck = createDeckFixture({ id: crypto.randomUUID(), uid });
      const card = createCard({ id: crypto.randomUUID(), deckId: deck.id, uid });
      await createDeckCommand(uid, deck);
      await createCardCommand(uid, card);
      await vi.waitFor(() => {
        expect(deckStore.getState().decks).toContainEqual(expect.objectContaining({ id: deck.id }));
        expect(cardSnapshots.at(-1)?.itemsById[card.id]).toMatchObject({ id: card.id });
      });

      await editDeck(uid, { ...deck, name: "Updated" });
      await editCard(uid, { ...card, frontText: "Updated" });
      await vi.waitFor(() => {
        expect(deckStore.getState().decks).toContainEqual(expect.objectContaining({ id: deck.id, name: "Updated" }));
        expect(cardSnapshots.at(-1)?.itemsById[card.id]?.frontText).toBe("Updated");
      });

      await deleteCard(uid, card);
      await deleteDeck(uid, deck);
      await vi.waitFor(() => {
        expect(deckStore.getState().decks.find((candidate) => candidate.id === deck.id)).toBeUndefined();
        expect(cardSnapshots.at(-1)?.itemsById[card.id]).toBeUndefined();
      });
      expect(errors).toEqual([]);
    } finally {
      stopCards();
      stopDecks();
    }
  });
});
