/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", and "should import cards".
 */

import { mutateCards, type Card } from "@/entities/card";
import type { CardCreateInput, RemoteCard } from "@/entities/card/model/types";

import "@/test/initializeTestFirestore";
import { describe, expect, it, vi } from "vitest";
import { collection, deleteDoc, doc, getDoc, getDocs, getFirestore, query, where } from "firebase/firestore";
import { createCard as createCardCommand, deleteCard, editCard } from "@/entities/card/api/firestore";
import { createDeck as createDeckCommand } from "@/entities/deck/api/firestore";
import { replaceRemoteCards } from "@/entities/card/model/actions/replaceRemoteCards";
import { replaceRemoteDecks } from "@/entities/deck/model/actions/replaceRemoteDecks";
import { editRemoteStudyProgress } from "@/entities/study-progress/api/firestore";
import * as Uuid from "uuid";
import { createCard, createDeck, createRemoteDeckInput } from "@/test/factories";

const uuid = Uuid.v4;

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe.concurrent("firestore/card [CARD-01] [SWIPE-02]", { retry: 3 }, () => {
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
    expect(data).toEqual({
      ...newCard,
      deckId,
      id: c.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    expect(data?.createdAt).toBe(data?.updatedAt);
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    const created = (await getDoc(doc(db, "card", c.id))).data();
    if (created === undefined) throw new Error("Created Card was not found");
    const n = {
      ...c,
      frontText: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await editCard("uid", n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...created, frontText: "updated", updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(created.createdAt);
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("updates StudyProgress without changing Card-owned fields", async () => {
    const deckId = await initDeck();
    const card = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", card);
    const created = (await getDoc(doc(db, "card", card.id))).data();
    if (created === undefined) throw new Error("Created Card was not found");
    const untrustedProgress = {
      cardId: card.id,
      difficulty: 5.5,
      numberOfSeen: 3,
      frontText: "unexpected",
      deckId: "other-deck",
      uid: "other-user",
      deletedAt: 1,
    } as unknown as Parameters<typeof editRemoteStudyProgress>[1];

    await editRemoteStudyProgress("uid", untrustedProgress);

    const data = (await getDoc(doc(db, "card", card.id))).data();
    expect(data).toEqual({ ...created, difficulty: 5.5, numberOfSeen: 3, updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(created.createdAt);
  });

  it("should upsert a complete card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid(), frontText: "upserted" };

    await mutateCards("uid", [{ kind: "create", card: c }]);

    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...c, createdAt: expect.any(Number), updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(data?.updatedAt);
  });

  it("reports failed imported Cards while persisting valid Cards", async () => {
    const deckId = await initDeck();
    const valid = { ...newCard, deckId, id: uuid(), frontText: "valid" };
    const invalid = { ...newCard, deckId, id: uuid(), frontText: 42 } as unknown as RemoteCard;

    await expect(
      mutateCards("uid", [
        { kind: "create", card: valid },
        { kind: "create", card: invalid },
      ])
    ).rejects.toThrow();

    const data = (await getDoc(doc(db, "card", valid.id))).data();
    expect(data).toEqual({ ...valid, createdAt: expect.any(Number), updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(data?.updatedAt);
  });

  it("does not recreate an existing Card deleted after import planning", async () => {
    const deckId = await initDeck();
    const card = { ...newCard, deckId, id: uuid(), frontText: "planned update" };
    await createCardCommand("uid", card);
    replaceRemoteDecks([createDeck({ id: deckId, uid: "uid", localMode: false })]);
    replaceRemoteCards([card]);
    await deleteDoc(doc(db, "card", card.id));

    await expect(mutateCards("uid", [{ kind: "edit", card }])).rejects.toThrow();
    const ownedCards = await getDocs(query(collection(db, "card"), where("uid", "==", "uid")));
    expect(ownedCards.docs.some((snapshot) => snapshot.id === card.id)).toBe(false);
  });

  it("should logical-remove a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    const created = (await getDoc(doc(db, "card", c.id))).data();
    if (created === undefined) throw new Error("Created Card was not found");
    await deleteCard("uid", c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...created, updatedAt: expect.any(Number), deletedAt: expect.any(Number) });
    expect(data?.deletedAt).toBe(data?.updatedAt);
  });

  it("should exists a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await createCardCommand("uid", c);
    expect((await getDoc(doc(db, "card", c.id))).exists()).toBe(true);
  });
});
