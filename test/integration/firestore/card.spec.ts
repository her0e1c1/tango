/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", and "should import cards".
 */

import type { Card, CardCreateInput } from "@/entities/card";
import {
  createCard as createCardCommand,
  createDeck as createDeckCommand,
  deleteCard,
  editCard,
  editStudyProgress,
} from "@/features/firebase-runtime";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { collection, deleteDoc, getDocs, getFirestore, doc, getDoc, query, where } from "firebase/firestore";
import { upsertImportedCards } from "@/features/deck-import/api/upsertImportedCards";
import { getTimestamp } from "@/shared/firebase";
import * as UUID from "uuid";
import { createCard, createDeck } from "@/test/factories";

const uuid = UUID.v4;

vi.mock("@/shared/firebase", async () => ({
  ...(await import("@/test/firebaseHelpers")).firebaseHelpers,
  db: (await import("@/test/initializeTestFirestore")).testDb,
  getTimestamp: vi.fn(),
}));

describe.concurrent("firestore/card", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newCard = createCard({
    frontText: "front text",
    backText: "back text",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  });

  beforeEach(async () => {
    (getTimestamp as Mock).mockReturnValue(timestamp);
  });

  // card needs to belong to its deck
  const initDeck = async () => {
    const id = uuid();
    await createDeckCommand("uid", createDeck({ uid: "uid", id }));
    return id;
  };

  it("should create a card", async () => {
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
    } satisfies CardCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createCardCommand("uid", c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...newCard, deckId, id: c.id });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    const n = {
      ...c,
      frontText: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await editCard("uid", n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...c, frontText: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("updates StudyProgress without changing Card-owned fields", async () => {
    const deckId = await initDeck();
    const card = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", card);
    const untrustedProgress = {
      cardId: card.id,
      score: 2,
      numberOfSeen: 3,
      frontText: "unexpected",
      deckId: "other-deck",
      uid: "other-user",
      deletedAt: 1,
    } as unknown as Parameters<typeof editStudyProgress>[1];

    await editStudyProgress("uid", untrustedProgress);

    expect((await getDoc(doc(db, "card", card.id))).data()).toEqual({ ...card, score: 2, numberOfSeen: 3 });
  });

  it("should upsert a complete card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid(), frontText: "upserted" };

    await upsertImportedCards("uid", [c], [c.id], { createCard: createCardCommand, editCard });

    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(c);
  });

  it("reports failed imported Cards while persisting valid Cards", async () => {
    const deckId = await initDeck();
    const valid = { ...newCard, deckId, id: uuid(), frontText: "valid" };
    const invalid = { ...newCard, deckId, id: uuid(), frontText: 42 } as unknown as Card;

    await expect(
      upsertImportedCards("uid", [valid, invalid], [valid.id, invalid.id], {
        createCard: createCardCommand,
        editCard,
      })
    ).rejects.toMatchObject({
      failedIds: [invalid.id],
      message: "1 of 2 Card writes failed",
    });

    expect((await getDoc(doc(db, "card", valid.id))).data()).toEqual(valid);
  });

  it("does not recreate an existing Card deleted after import planning", async () => {
    const deckId = await initDeck();
    const card = { ...newCard, deckId, id: uuid(), frontText: "planned update" };
    await createCardCommand("uid", card);
    await deleteDoc(doc(db, "card", card.id));

    await expect(
      upsertImportedCards("uid", [card], [], { createCard: createCardCommand, editCard })
    ).rejects.toMatchObject({ failedIds: [card.id] });
    const ownedCards = await getDocs(query(collection(db, "card"), where("uid", "==", "uid")));
    expect(ownedCards.docs.some((snapshot) => snapshot.id === card.id)).toBe(false);
  });

  it("should logical-remove a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    await deleteCard("uid", c);
    const d = { ...c, deckId, deletedAt: timestamp } as Card;
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(d);
  });

  it("should exists a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    expect((await getDoc(doc(db, "card", c.id))).exists()).toBe(true);
  });
});
