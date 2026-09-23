/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import "@/test/initializeTestFirestore";
import { readDeckTags, writeDeckTags } from "@/entities/deck";
import { readCardsForTagUpdate, writeCardTagChanges } from "@/entities/card";
import { createLocalBatch } from "@/shared/firestore-write";
import { describe, expect, it, vi } from "vitest";
import {
  doc,
  writeBatch,
  disableNetwork,
  enableNetwork,
  getDocFromCache,
  getDoc as readServerDoc,
  waitForPendingWrites,
  type DocumentReference,
  getFirestore,
} from "firebase/firestore";
import { createCard as createCardCommand, editCard as editCardCommand } from "@/entities/card/api/firestore";
import { createDeck, deleteDeck, editDeck } from "@/entities/deck/api/firestore";
import * as Uuid from "uuid";
import { createCard, createDeck as createDeckFixture, createRemoteDeckInput } from "@/test/factories";

// Adapter operations complete locally; cloud assertions wait for SDK acknowledgement.
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

      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies RemoteDeckCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({
      ...toFirestoreDeck(newDeck),
      id: d.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    expect(data?.createdAt).toBe(data?.updatedAt);
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
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    };
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...created, name: "updated", updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(created.createdAt);
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

    await deleteDeck("uid", d.id);

    expect((await getDoc(doc(db, "deck", d.id))).data()?.deletedAt).toEqual(expect.any(Number));
    await Promise.all(
      cards.map(async (card) => expect((await getDoc(doc(db, "card", card.id))).data()?.deletedAt).toBeNull())
    );
  });

  it("[FIRESTORE-DECK-07] atomically renames 501 Cards and retains tags during ordinary Deck edits", async () => {
    const deck = createRemoteDeckInput({ id: uuid() });
    await createDeck("uid", deck);
    const cards = Array.from({ length: 501 }, () =>
      createCard({ id: uuid(), deckId: deck.id, uid: "uid", tags: ["old", "kept"] })
    );
    await Promise.all(cards.map((card) => createCardCommand("uid", card)));
    await waitForPendingWrites(db);
    const before = await Promise.all(cards.map(async (card) => (await getDoc(doc(db, "card", card.id))).data()));
    expect(await readDeckTags("uid", deck.id)).toEqual([]);
    const stored = await readCardsForTagUpdate("uid", deck.id);
    const { batch, commit } = createLocalBatch("uid");
    const deckReference = writeDeckTags(batch, deck.id, ["renamed", "kept"]);
    const cardReferences = writeCardTagChanges(batch, stored, "old", "renamed");
    await commit([deckReference, ...cardReferences]);
    await editDeck("uid", { id: deck.id, name: "Updated name" });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({
      name: "Updated name",
      tags: ["renamed", "kept"],
    });
    await Promise.all(
      cards.map(async (card, index) => {
        expect((await getDoc(doc(db, "card", card.id))).data()).toEqual({
          ...before[index],
          tags: ["renamed", "kept"],
          updatedAt: expect.any(Number),
        });
      })
    );
  }, 30_000);

  it("[FIRESTORE-DECK-08] rejects the whole tag update when a Card write violates ownership rules", async () => {
    const deck = createRemoteDeckInput({ id: uuid() });
    await createDeck("uid", deck);
    const card = createCard({ id: uuid(), deckId: deck.id, uid: "uid", tags: ["old", "kept"] });
    await createCardCommand("uid", card);
    const deckRef = doc(db, "deck", deck.id);
    const cardRef = doc(db, "card", card.id);
    const beforeDeck = (await getDoc(deckRef)).data();
    const beforeCard = (await getDoc(cardRef)).data();
    await readDeckTags("uid", deck.id);
    const stored = await readCardsForTagUpdate("uid", deck.id);
    const batch = writeBatch(db);
    writeDeckTags(batch, deck.id, ["renamed", "kept"]);
    writeCardTagChanges(batch, stored, "old", "renamed");
    batch.update(cardRef, { uid: "another-user" });
    await expect(batch.commit()).rejects.toMatchObject({ code: "permission-denied" });
    expect((await getDoc(deckRef)).data()).toEqual(beforeDeck);
    expect((await getDoc(cardRef)).data()).toEqual(beforeCard);
  });

  // Pending implementation of the deletion contract documented in PR #1731.
  it.todo("[FIRESTORE-DECK-05] tombstones an empty Deck");
  it.todo("[FIRESTORE-DECK-06] leaves the Deck and all child Cards unchanged when the delete batch is rejected");
});

describe("firestore/deck pending Card writes", () => {
  it.each(["renamed", undefined])(
    "[FIRESTORE-DECK-09] queues tag replacement %s after pending Card creation and editing",
    async (replacement) => {
      const db = getFirestore();
      const deck = createRemoteDeckInput({ id: uuid() });
      await createDeck("uid", deck);
      const existing = createCard({ id: uuid(), deckId: deck.id, uid: "uid", tags: ["old", "kept"] });
      await createCardCommand("uid", existing);
      await waitForPendingWrites(db);
      await disableNetwork(db);
      const created = createCard({ id: uuid(), deckId: deck.id, uid: "uid", tags: ["old", "kept"] });
      try {
        await createCardCommand("uid", created);
        await editCardCommand("uid", {
          id: existing.id,
          uid: "uid",
          frontText: "Pending text edit",
          tags: ["old", "kept"],
        });
        const stored = await readCardsForTagUpdate("uid", deck.id);
        expect(stored.map((card) => card.reference.id).sort()).toEqual([existing.id, created.id].sort());
        const { batch, commit } = createLocalBatch("uid");
        const tags = replacement === undefined ? ["kept"] : [replacement, "kept"];
        const deckReference = writeDeckTags(batch, deck.id, tags);
        const cardReferences = writeCardTagChanges(batch, stored, "old", replacement);
        await commit([deckReference, ...cardReferences]);
        for (const id of [existing.id, created.id]) {
          const local = await getDocFromCache(doc(db, "card", id));
          expect(local.metadata.hasPendingWrites).toBe(true);
          expect(local.data()?.tags).toEqual(tags);
        }
        await enableNetwork(db);
        await waitForPendingWrites(db);
        expect((await getDoc(doc(db, "deck", deck.id))).data()?.tags).toEqual(tags);
        expect((await getDoc(doc(db, "card", existing.id))).data()).toMatchObject({
          frontText: "Pending text edit",
          backText: existing.backText,
          tags,
        });
        expect((await getDoc(doc(db, "card", created.id))).data()).toMatchObject({
          frontText: created.frontText,
          backText: created.backText,
          tags,
        });
      } finally {
        await enableNetwork(db);
        await waitForPendingWrites(db);
      }
    }
  );
});
