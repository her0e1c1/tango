/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", and "should import cards".
 */

import { mutateCards, type Card, type RemoteCard } from "@/entities/card";
import type { CardCreateInput } from "@/entities/card/model/types";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { collection, deleteDoc, getDocs, getFirestore, doc, getDoc, query, where } from "firebase/firestore";
import { createCard as createCardCommand, deleteCard, editCard } from "@/entities/card/api/firestore";
import { createDeck as createDeckCommand } from "@/entities/deck/api/firestore";
import { replaceRemoteCards } from "@/entities/card/model/store";
import { replaceRemoteDecks } from "@/entities/deck/model/store";
import { editStudyProgress } from "@/entities/study-progress";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import { v4 as uuid } from "uuid";
import { createCard, createDeck } from "@/test/factories";

vi.mock("@/shared/lib/currentTime", () => ({ getCurrentTimeMillis: vi.fn() }));
vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
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

  beforeEach(() => {
    (getCurrentTimeMillis as Mock).mockReturnValue(timestamp);
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

    await mutateCards("uid", [{ kind: "create", card: c }]);

    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(c);
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
    replaceRemoteDecks([createDeck({ id: deckId, uid: "uid", localMode: false })]);
    replaceRemoteCards([card]);
    await deleteDoc(doc(db, "card", card.id));

    await expect(mutateCards("uid", [{ kind: "edit", card }])).rejects.toMatchObject({ failedIds: [card.id] });
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
