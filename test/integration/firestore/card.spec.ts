/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", and "should import cards".
 */

import { calculateFsrsState, type Card } from "@/entities/card";
import type { RemoteCard } from "@/entities/card/model/types";

import "@/test/initializeTestFirestore";
import { describe, expect, it, vi } from "vitest";
import {
  collection,
  updateDoc,
  doc,
  Timestamp,
  serverTimestamp,
  getDoc as readServerDoc,
  waitForPendingWrites,
  type DocumentReference,
  getDocs,
  getFirestore,
  query,
  where,
} from "firebase/firestore";
import { createCard as createCardCommand, deleteCard, editCard } from "@/entities/card";
import { createDeck as createDeckCommand } from "@/entities/deck/api/firestore";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { replaceRemoteDecks } from "@/test/utils/entityFixtures";
import * as Uuid from "uuid";
import { createCard, createDeck, createRemoteDeckInput } from "@/test/factories";

// Adapter operations submit through the local SDK; cloud assertions wait for acknowledgement.
const getDoc = async (reference: DocumentReference) => {
  await waitForPendingWrites(reference.firestore);
  return readServerDoc(reference);
};

const uuid = Uuid.v4;

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
  auth: { currentUser: { uid: "uid" } },
}));

describe("firestore/card", { retry: 3 }, () => {
  const db = getFirestore();
  const newCard = createCard({
    frontText: "front text",
    backText: "back text",
    uid: "uid",
    createdAt: 0,
    updatedAt: 0,
    deletedAt: null,
  });

  // card needs to belong to its deck
  const initDeck = async () => {
    const id = uuid();
    await createDeckCommand("uid", createRemoteDeckInput({ id }));
    replaceRemoteDecks([createDeck({ id, uid: "uid" })]);
    return id;
  };

  it("[FIRESTORE-CARD-01] should create a card", async () => {
    // Given: Prepare `deckId`, `c` and any shared test state below.
    const deckId = await initDeck();
    const c = {
      id: uuid(),
      deckId,
      uid: "uid",
      frontText: "front text",
      backText: "back text",
      tags: [],
      uniqueKey: "unique-key",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Parameters<typeof createCardCommand>[1] & { uid: string; currentIndex: number; cardOrderIds: string[] };
    // When: Exercise `createCardCommand` with the prepared inputs.
    await createCardCommand("uid", c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data).toEqual({
      ...newCard,
      deckId,
      id: c.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Timestamp),
    });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("[FIRESTORE-CARD-02] updates a card through editing", async () => {
    // Given: Prepare `deckId`, `c`, `fsrs` and any shared test state below.
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    const fsrs = calculateFsrsState(null, "good", 1000);
    await updateDoc(doc(db, "card", c.id), { fsrs, updatedAt: serverTimestamp() });
    const created = (await getDoc(doc(db, "card", c.id))).data();
    if (created === undefined) throw new Error("Created Card was not found");
    const n = {
      ...c,
      fsrs: undefined,
      frontText: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Omit<Card, "fsrs"> & { fsrs: undefined; currentIndex: number; cardOrderIds: string[] };
    replaceRemoteCards([{ ...c, fsrs }]);
    // When: Exercise `editCard` with the prepared inputs.
    await editCard("uid", n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data).toEqual({ ...created, frontText: "updated", updatedAt: expect.any(Timestamp) });
    expect(data?.createdAt).toBe(created.createdAt);
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("[FIRESTORE-CARD-03] excludes personal study fields from new Card writes", async () => {
    // Given: Prepare `deckId`, `card` and any shared test state below.
    const deckId = await initDeck();
    const card = {
      ...newCard,
      deckId,
      id: uuid(),
      fsrs: calculateFsrsState(null, "easy", 1000),
      difficulty: 5,
      numberOfSeen: 3,
    };
    // When: Exercise `createCardCommand` with the prepared inputs.
    await createCardCommand("uid", card);
    const data = (await getDoc(doc(db, "card", card.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data?.fsrs).toBeNull();
    expect(data).not.toHaveProperty("difficulty");
    expect(data).not.toHaveProperty("numberOfSeen");
  });

  it("[FIRESTORE-CARD-04] preserves a rated Card when retrying a prepared create", async () => {
    // Given: Prepare `deckId`, `c` and any shared test state below.
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid(), frontText: "upserted" };

    // When: Exercise `createCardCommand` with the prepared inputs.
    await createCardCommand("uid", c);

    const data = (await getDoc(doc(db, "card", c.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data).toEqual({ ...c, createdAt: expect.any(Number), updatedAt: expect.any(Timestamp) });
    const reference = doc(db, "card", c.id);
    // When: Exercise `updateDoc` with the prepared inputs.
    await updateDoc(reference, { fsrs: calculateFsrsState(null, "good", 1000), updatedAt: serverTimestamp() });
    const rated = (await getDoc(reference)).data();

    await createCardCommand("uid", c);

    // Then: Verify the expected result in the assertions below.
    expect((await getDoc(reference)).data()).toEqual(rated);
  });

  it("[FIRESTORE-CARD-05] reports failed imported Cards while persisting valid Cards", async () => {
    // Given: Prepare `deckId`, `valid`, `invalid` and any shared test state below.
    const deckId = await initDeck();
    const valid = { ...newCard, deckId, id: uuid(), frontText: "valid" };
    const invalid = { ...newCard, deckId, id: uuid(), frontText: 42 } as unknown as RemoteCard;

    // When: Evaluate `createCardCommand` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    await expect(
      Promise.allSettled([createCardCommand("uid", valid), createCardCommand("uid", invalid)]).then((results) => {
        const failure = results.find((result) => result.status === "rejected");
        if (failure?.status === "rejected") throw failure.reason;
      })
    ).rejects.toThrow();

    const data = (await getDoc(doc(db, "card", valid.id))).data();
    expect(data).toEqual({ ...valid, createdAt: expect.any(Number), updatedAt: expect.any(Timestamp) });
  });

  it("[FIRESTORE-CARD-06] does not recreate an existing Card deleted after import planning", async () => {
    // Given: Prepare `deckId`, `card` and any shared test state below.
    const deckId = await initDeck();
    const card = { ...newCard, deckId, id: uuid(), frontText: "planned update" };
    await createCardCommand("uid", card);
    replaceRemoteDecks([createDeck({ id: deckId, uid: "uid" })]);
    replaceRemoteCards([card]);
    await deleteCard("uid", card.id);
    await waitForPendingWrites(db);

    await editCard("uid", card);
    await waitForPendingWrites(db);
    // When: Exercise `query` with the prepared inputs.
    const ownedCards = await getDocs(query(collection(db, "card"), where("uid", "==", "uid")));
    // Then: Verify the expected result in the assertions below.
    expect(ownedCards.docs.find((snapshot) => snapshot.id === card.id)?.data().deletedAt).toEqual(expect.any(Number));
  });

  it("[FIRESTORE-CARD-07] should logical-remove a card", async () => {
    // Given: Prepare `deckId`, `c`, `created` and any shared test state below.
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    const created = (await getDoc(doc(db, "card", c.id))).data();
    if (created === undefined) throw new Error("Created Card was not found");
    replaceRemoteCards([c]);
    // When: Exercise `deleteCard` with the prepared inputs.
    await deleteCard("uid", c.id);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    // Then: Verify the expected result in the assertions below.
    expect(data).toEqual({ ...created, updatedAt: expect.any(Timestamp), deletedAt: expect.any(Number) });
  });

  it("[FIRESTORE-CARD-08] should exists a card", async () => {
    // Given: Prepare `deckId`, `c` and any shared test state below.
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    // When: Exercise `createCardCommand` with the prepared inputs.
    await createCardCommand("uid", c);
    // Then: Verify the expected result in the assertions below.
    expect((await getDoc(doc(db, "card", c.id))).exists()).toBe(true);
  });
});
