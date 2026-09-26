/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import "@/test/initializeTestFirestore";
import { describe, expect, it, vi } from "vitest";
import {
  doc,
  Timestamp,
  getDoc as readServerDoc,
  waitForPendingWrites,
  type DocumentReference,
  getFirestore,
} from "firebase/firestore";
import { createCard as createCardCommand } from "@/entities/card/api/firestore";
import { createDeck, deleteDeck, editDeck } from "@/entities/deck/api/firestore";
import * as Uuid from "uuid";
import { createCard, createDeck as createDeckFixture, createRemoteDeckInput } from "@/test/factories";

// Adapter operations submit through the local SDK; cloud assertions wait for acknowledgement.
const getDoc = async (reference: DocumentReference) => {
  await waitForPendingWrites(reference.firestore);
  return readServerDoc(reference);
};

const uuid = Uuid.v4;

const toFirestoreDeck = (deck: Deck) => ({
  ...deck,
  deletedAt: null,
});

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const newDeck = createDeckFixture({
    name: "new deck name",
    uid: "uid",
    createdAt: 0,
    updatedAt: 0,
  });

  it("[FIRESTORE-DECK-01] should create a deck and check if exists", async () => {
    const d = {
      id: uuid(),
      name: "new deck name",

      tags: ["obsolete"],
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies RemoteDeckCreateInput & { currentIndex: number; cardOrderIds: string[]; tags: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({
      ...toFirestoreDeck(newDeck),
      id: d.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Timestamp),
    });
    expect(data).not.toHaveProperty("tags");
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBe(true);
  });

  it("[FIRESTORE-DECK-02] should update a deck", async () => {
    const d = createRemoteDeckInput({ id: uuid(), name: newDeck.name });
    await createDeck("uid", d);
    const created = (await getDoc(doc(db, "deck", d.id))).data();
    if (created === undefined) throw new Error("Created Deck was not found");
    const n = {
      ...d,
      name: "updated",
      tags: ["obsolete"],
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    };
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...created, name: "updated", updatedAt: expect.any(Timestamp) });
    expect(data?.createdAt).toBe(created.createdAt);
    expect(data).not.toHaveProperty("tags");
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("[FIRESTORE-DECK-03] preserves an omitted URL and removes a cleared URL", async () => {
    const deck = createRemoteDeckInput({
      id: uuid(),
      name: newDeck.name,
      url: "https://example.com/deck",
    });
    await createDeck("uid", deck);

    await editDeck("uid", { id: deck.id, name: "updated" });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({ url: deck.url });

    await editDeck("uid", { id: deck.id, url: null });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).not.toHaveProperty("url");
  });

  it("[FIRESTORE-DECK-04] tombstones the parent without rewriting child documents", async () => {
    const d = createRemoteDeckInput({ id: uuid(), name: newDeck.name });
    const cards = [
      createCard({ id: uuid(), deckId: d.id, uid: "uid" }),
      createCard({ id: uuid(), deckId: d.id, uid: "uid" }),
    ];
    await createDeck("uid", d);
    await Promise.all(cards.map((card) => createCardCommand("uid", card)));

    const otherDeck = createRemoteDeckInput({ id: uuid() });
    const otherCard = createCard({ id: uuid(), deckId: otherDeck.id, uid: "uid" });
    await createDeck("uid", otherDeck);
    await createCardCommand("uid", otherCard);
    const references = [
      doc(db, "deck", otherDeck.id),
      ...[...cards, otherCard].map((card) => doc(db, "card", card.id)),
    ];
    const before = await Promise.all(references.map(async (reference) => (await getDoc(reference)).data()));
    await deleteDeck("uid", d.id);

    expect(await Promise.all(references.map(async (reference) => (await getDoc(reference)).data()))).toEqual(before);
    expect((await getDoc(doc(db, "deck", d.id))).data()?.deletedAt).toEqual(expect.any(Number));
    await Promise.all(
      cards.map(async (card) => expect((await getDoc(doc(db, "card", card.id))).data()?.deletedAt).toBeNull())
    );
  });

  it("[FIRESTORE-DECK-05] tombstones an empty Deck", async () => {
    const deck = createRemoteDeckInput({ id: uuid() });
    await createDeck("uid", deck);
    const reference = doc(db, "deck", deck.id);
    const before = (await getDoc(reference)).data();

    await deleteDeck("uid", deck.id);

    const deleted = await getDoc(reference);
    expect(deleted.exists()).toBe(true);
    expect(deleted.data()).toEqual({ ...before, deletedAt: expect.any(Number), updatedAt: expect.any(Timestamp) });
  });

  // Child tombstoning is not implemented by the current parent-only deletion operation.
  it.todo("[FIRESTORE-DECK-06] leaves the Deck and all child Cards unchanged when the delete batch is rejected");
});
