/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck, DeckCreateInput } from "@/entities/deck";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createCard as createCardCommand } from "@/entities/card/api/firestore";
import { cardStore } from "@/entities/card/model/store";
import {
  beginDeckMigration,
  createDeck,
  deleteDeck,
  editDeck,
  finalizeDeckMigration,
  writeDeckMigrationCards,
} from "@/entities/deck/api/firestore";
import { editDeck as editStoredDeck } from "@/entities/deck";
import { deckStore } from "@/entities/deck/model/store";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import * as Uuid from "uuid";
import { createCard, createDeck as createDeckFixture, createLocalCard, createLocalDeck } from "@/test/factories";

const uuid = Uuid.v4;

const toFirestoreDeck = ({ localMode: _localMode, ...deck }: Extract<Deck, { localMode: false }>) => ({
  ...deck,
  deletedAt: null,
});

vi.mock("@/shared/lib/currentTime", () => ({ getCurrentTimeMillis: vi.fn() }));
vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = createDeckFixture({
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  beforeEach(() => {
    // must return the same value (no need to reset mock in parallel)
    (getCurrentTimeMillis as Mock).mockReturnValue(timestamp);
  });

  it("should create a deck and check if exists", async () => {
    const d = {
      id: uuid(),
      uid: "uid",
      name: "new deck name",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies DeckCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...toFirestoreDeck(newDeck), id: d.id });
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBe(true);
  });

  it("should update a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await createDeck("uid", d);
    const n = {
      ...d,
      name: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...toFirestoreDeck(d), name: "updated" });
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("preserves an omitted URL and removes a cleared URL", async () => {
    const deck = { ...newDeck, id: uuid(), url: "https://example.com/deck" };
    await createDeck("uid", deck);

    await editDeck("uid", { id: deck.id, name: "updated" });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({ url: deck.url });

    await editDeck("uid", { id: deck.id, url: null });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).not.toHaveProperty("url");
  });

  it("should delete a deck and its Cards", async () => {
    const d = { ...newDeck, id: uuid() };
    const cards = [
      createCard({ id: uuid(), deckId: d.id, uid: d.uid }),
      createCard({ id: uuid(), deckId: d.id, uid: d.uid }),
    ];
    await createDeck("uid", d);
    await Promise.all(cards.map((card) => createCardCommand("uid", card)));

    await deleteDeck("uid", d.id);

    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBe(false);
    await Promise.all(
      cards.map((card) => expect(getDoc(doc(db, "card", card.id))).rejects.toMatchObject({ code: "permission-denied" }))
    );
  });

  it("rejects older Card writes and finalization after a newer migration completes", async () => {
    const deckId = uuid();
    const cardId = uuid();
    const oldDeck = { ...newDeck, id: deckId, name: "old snapshot" };
    const newDeckRevision = { ...newDeck, id: deckId, name: "new snapshot" };
    const oldMigration = { id: uuid(), revision: 0, fingerprint: "a".repeat(64) };
    const newMigration = { id: uuid(), revision: 1, fingerprint: "b".repeat(64) };

    await beginDeckMigration("uid", oldDeck, oldMigration);
    await beginDeckMigration("uid", newDeckRevision, newMigration);
    await writeDeckMigrationCards("uid", deckId, newMigration, [
      createCard({ id: cardId, deckId, uid: "uid", frontText: "new card" }),
    ]);
    await finalizeDeckMigration("uid", deckId, newMigration);

    await expect(
      writeDeckMigrationCards("uid", deckId, oldMigration, [
        createCard({ id: cardId, deckId, uid: "uid", frontText: "old card" }),
      ])
    ).rejects.toMatchObject({ code: "permission-denied" });
    await expect(finalizeDeckMigration("uid", deckId, oldMigration)).rejects.toThrow("replaced by a newer revision");
    expect((await getDoc(doc(db, "deck", deckId))).data()).toMatchObject({
      id: deckId,
      name: "new snapshot",
      migration: { ...newMigration, state: "complete" },
    });
    expect((await getDoc(doc(db, "card", cardId))).data()).toMatchObject({
      id: cardId,
      frontText: "new card",
      migrationId: newMigration.id,
    });
  });

  it("does not share a migration id across different snapshots at the same revision", async () => {
    const deckId = uuid();
    const cardId = uuid();
    const firstMigration = { id: uuid(), revision: 1, fingerprint: "a".repeat(64) };
    const secondMigration = { id: uuid(), revision: 1, fingerprint: "b".repeat(64) };

    await beginDeckMigration("uid", { ...newDeck, id: deckId, name: "first snapshot" }, firstMigration);
    const secondStart = await beginDeckMigration(
      "uid",
      { ...newDeck, id: deckId, name: "second snapshot" },
      secondMigration
    );

    expect(secondStart.migration).toEqual(secondMigration);
    await expect(
      writeDeckMigrationCards("uid", deckId, firstMigration, [
        createCard({ id: cardId, deckId, uid: "uid", frontText: "first card" }),
      ])
    ).rejects.toMatchObject({ code: "permission-denied" });
    await writeDeckMigrationCards("uid", deckId, secondMigration, [
      createCard({ id: cardId, deckId, uid: "uid", frontText: "second card" }),
    ]);
    await finalizeDeckMigration("uid", deckId, secondMigration);

    expect((await getDoc(doc(db, "deck", deckId))).data()).toMatchObject({
      name: "second snapshot",
      migration: { ...secondMigration, state: "complete" },
    });
    expect((await getDoc(doc(db, "card", cardId))).data()).toMatchObject({
      frontText: "second card",
      migrationId: secondMigration.id,
    });
  });

  it.sequential("moves a local Deck and its Cards to Firestore when local mode is disabled", async () => {
    const deck = createLocalDeck({ id: uuid(), name: "Local Deck" });
    const cards = [
      createLocalCard({ id: uuid(), deckId: deck.id, frontText: "first" }),
      createLocalCard({ id: uuid(), deckId: deck.id, frontText: "second" }),
    ];
    deckStore.setState({ localDecks: [deck] });
    cardStore.setState({ localCards: cards });

    await editStoredDeck("uid", { id: deck.id, name: "Synced Deck", localMode: false });

    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({
      id: deck.id,
      uid: "uid",
      name: "Synced Deck",
    });
    await Promise.all(
      cards.map(async (card) => {
        expect((await getDoc(doc(db, "card", card.id))).data()).toMatchObject({
          id: card.id,
          deckId: deck.id,
          uid: "uid",
          frontText: card.frontText,
        });
      })
    );
    expect(deckStore.getState().localDecks).not.toContainEqual(expect.objectContaining({ id: deck.id }));
    expect(cardStore.getState().localCards).not.toContainEqual(expect.objectContaining({ deckId: deck.id }));
  });

  it.sequential("moves a local Deck with 500 Cards through resumable chunks", async () => {
    const deck = createLocalDeck({ id: uuid(), name: "Large local Deck" });
    const cards = Array.from({ length: 500 }, (_, index) =>
      createLocalCard({ id: uuid(), deckId: deck.id, frontText: `card ${String(index)}` })
    );
    deckStore.setState({ localDecks: [deck] });
    cardStore.setState({ localCards: cards });

    await editStoredDeck("uid", { id: deck.id, localMode: false });

    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({
      id: deck.id,
      migration: expect.objectContaining({ state: "complete" }),
    });
    const edgeCards = [cards[0], cards.at(-1)];
    await Promise.all(
      edgeCards.map(async (card) => {
        if (card === undefined) throw new Error("Expected migration edge Card");
        expect((await getDoc(doc(db, "card", card.id))).data()).toMatchObject({ deckId: deck.id });
      })
    );
    expect(deckStore.getState().localDecks).toEqual([]);
    expect(cardStore.getState().localCards).toEqual([]);
  });
});
