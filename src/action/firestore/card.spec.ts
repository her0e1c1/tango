import "./init";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as firestore from "@src/action/firestore";
import { getTimestamp } from "@src/action/firestore/mocked";
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
    const c = {
      ...newCard,
      deckId,
      id: uuid(),
      localMode: false,
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } as unknown as Card;
    await firestore.card.create(c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...newCard, deckId, id: c.id });
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await firestore.card.create(c);
    const n = {
      ...c,
      frontText: "updated",
      localMode: false,
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } as unknown as Card;
    await firestore.card.update(n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...c, frontText: "updated" });
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
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
