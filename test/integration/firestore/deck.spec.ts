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
  getDocFromServer,
} from "firebase/firestore";
import { createCard as createCardCommand } from "@/entities/card";
import { createDeck, deleteDeck, editDeck, subscribeDecks, getDecks, clearRemoteDecks } from "@/entities/deck";
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
    // Given: Prepare `d` and any shared test state below.
    const d = {
      id: uuid(),
      name: "new deck name",

      tags: ["obsolete"],
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies RemoteDeckCreateInput & { currentIndex: number; cardOrderIds: string[]; tags: string[] };
    // When: Exercise `createDeck` with the prepared inputs.
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    // Then: Verify the expected result in the assertions below.
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
    // Given: Prepare `d`, `created`, `n` and any shared test state below.
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
    // When: Exercise `editDeck` with the prepared inputs.
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data).toEqual({ ...created, name: "updated", updatedAt: expect.any(Timestamp) });
    expect(data?.createdAt).toBe(created.createdAt);
    expect(data).not.toHaveProperty("tags");
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it.sequential.each([false, true])(
    "[FIRESTORE-DECK-03] preserves legacy convertToBr=%s through partial edits and subscriptions",
    async (convertToBr) => {
      // Given: Prepare `deck`, `reference`, `before` and any shared test state below.
      clearRemoteDecks();
      const deck = createRemoteDeckInput({
        id: uuid(),
        name: newDeck.name,
        category: "language",
        convertToBr,
        studyFilter: { selectedTags: ["study"], tagAndFilter: true },
        cardFilter: { selectedTags: ["browse"], tagAndFilter: false },
      });
      await createDeck("uid", deck);
      const reference = doc(db, "deck", deck.id);
      const before = (await getDocFromServer(reference)).data();
      const errors: Error[] = [];
      // When: Exercise `subscribeDecks` with the prepared inputs.
      const unsubscribe = subscribeDecks("uid", (error) => errors.push(error));
      // Then: Verify the expected result in the assertions below.
      try {
        // Then: Check the expected result after the operation in this branch.
        await vi.waitFor(() => {
          expect(getDecks().find((value) => value.id === deck.id)).toMatchObject(deck);
        });
        await editDeck("uid", { id: deck.id, name: "updated", category: "math" });
        // Then: Check the expected result after the operation in this branch.
        expect((await getDocFromServer(reference)).data()).toEqual({
          ...before,
          name: "updated",
          category: "math",
          updatedAt: expect.any(Timestamp),
        });
        // Then: Check the expected result after the operation in this branch.
        await vi.waitFor(() => {
          expect(getDecks().find((value) => value.id === deck.id)).toMatchObject({
            ...deck,
            name: "updated",
            category: "math",
          });
        });
        // Then: Check the expected result after the operation in this branch.
        expect(errors).toEqual([]);
      } finally {
        unsubscribe();
        clearRemoteDecks();
      }
    }
  );

  it("[FIRESTORE-DECK-04] tombstones the parent without rewriting child documents", async () => {
    // Given: Prepare `d`, `cards`, `otherDeck` and any shared test state below.
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
    // When: Exercise `deleteDeck` with the prepared inputs.
    await deleteDeck("uid", d.id);

    // Then: Verify the expected result in the assertions below.
    expect(await Promise.all(references.map(async (reference) => (await getDoc(reference)).data()))).toEqual(before);
    expect((await getDoc(doc(db, "deck", d.id))).data()?.deletedAt).toEqual(expect.any(Number));
    await Promise.all(
      cards.map(async (card) => expect((await getDoc(doc(db, "card", card.id))).data()?.deletedAt).toBeNull())
    );
  });

  it("[FIRESTORE-DECK-05] tombstones an empty Deck", async () => {
    // Given: Prepare `deck`, `reference`, `before` and any shared test state below.
    const deck = createRemoteDeckInput({ id: uuid() });
    await createDeck("uid", deck);
    const reference = doc(db, "deck", deck.id);
    const before = (await getDoc(reference)).data();

    // When: Exercise `deleteDeck` with the prepared inputs.
    await deleteDeck("uid", deck.id);

    const deleted = await getDoc(reference);
    // Then: Verify the expected result in the assertions below.
    expect(deleted.exists()).toBe(true);
    expect(deleted.data()).toEqual({ ...before, deletedAt: expect.any(Number), updatedAt: expect.any(Timestamp) });
  });

  // Child tombstoning is not implemented by the current parent-only deletion operation.
  // Given: This specification case is pending implementation.
  // When: The TODO placeholder executes no test operation.
  // Then: No assertions are claimed for this pending case.
  it.todo("[FIRESTORE-DECK-06] leaves the Deck and all child Cards unchanged when the delete batch is rejected");
});
