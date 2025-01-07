import "./init";
import { expect, it, describe, vi, beforeEach, Mock } from "vitest";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as firestore from ".";
import { getTimestamp } from "./mocked";
import { v4 as uuid } from "uuid";

vi.mock("./mocked", async (importOriginal) => ({
  ...((await importOriginal()) as any),
  getTimestamp: vi.fn(),
}));

describe.concurrent("firestore/card", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newCard = {
    frontText: "front text",
    backText: "back text",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as Card;

  beforeEach(async () => {
    (getTimestamp as Mock).mockReturnValue(timestamp);
  });

  // card needs to belong to its deck
  const initDeck = async () => {
    const id = uuid();
    await firestore.deck.create({ uid: "uid", id } as Deck);
    return id;
  };

  it("should create a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() } as Card;
    await firestore.card.create(c);
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(c);
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await firestore.card.create(c);
    const n = { ...c, frontText: "updated" };
    await firestore.card.update(n);
    expect((await getDoc(doc(db, "card", n.id))).data()).toEqual(n);
  });

  it("should bulk-update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await firestore.card.create(c);
    const n = { ...c, frontText: "updated" };
    await firestore.card.bulkUpdate([n]);
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(n);
  });

  it("should logical-remove a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await firestore.card.create(c);
    await firestore.card.logicalRemove(c.id);
    const d = { ...c, deckId, deletedAt: timestamp } as Card;
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(d);
  });

  it("should exists a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await firestore.card.create(c);
    expect(await firestore.card.exists(c.id)).toBeTruthy();
  });
});
