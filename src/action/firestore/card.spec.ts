import "./init";

import { expect, it, describe, vi, beforeEach, Mock } from "vitest";

import { getApps, deleteApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, doc, getDoc } from "firebase/firestore";

import * as firestore from ".";
import { generateDeckId, generateCardId, getTimestamp } from "./mocked";

const db = getFirestore();
connectFirestoreEmulator(db, process.env.VITE_DB_HOST, parseInt(process.env.VITE_DB_PORT));

vi.mock("./mocked", () => ({
  generateDeckId: vi.fn(),
  generateCardId: vi.fn(),
  getTimestamp: vi.fn(),
}));

describe.skip("firestore/card", () => {
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
    vi.clearAllMocks();
    vi.resetModules();
    (generateDeckId as Mock).mockReturnValue("deckId");
    (generateCardId as Mock).mockReturnValue("cardId");
    (getTimestamp as Mock).mockReturnValue(timestamp);
    await firestore.deck.removeAll();
  });

  afterAll(async () => {
    await Promise.all(
      getApps().map(async (app) => {
        await deleteApp(app);
      })
    );
  });

  it("should create a card", async () => {
    await firestore.card.create(newCard);
    const d = { ...newCard, id: "cardId" } as Card;
    expect((await getDoc(doc(db, "card", d.id))).data()).toEqual(d);
  });

  it("should bulk-create a card", async () => {
    await firestore.card.bulkCreate([newCard], { id: "deckId", uid: "uid" });
    const d = { ...newCard, id: "cardId", deckId: "deckId", uid: "uid" } as Card;
    expect((await getDoc(doc(db, "card", d.id))).data()).toEqual(d);
  });

  it("should update a card", async () => {
    await firestore.card.create(newCard);
    const d = { ...newCard, id: "cardId", frontText: "updated" } as Card;
    await firestore.card.update(d);
    expect((await getDoc(doc(db, "card", d.id))).data()).toEqual(d);
  });

  it("should bulk-update a card", async () => {
    await firestore.card.create(newCard);
    const d = { ...newCard, id: "cardId", frontText: "updated" } as Card;
    await firestore.card.bulkUpdate([d]);
    expect((await getDoc(doc(db, "card", d.id))).data()).toEqual(d);
  });

  it("should logical-remove a card", async () => {
    await firestore.card.create(newCard);
    await firestore.card.logicalRemove("cardId");
    const d = { ...newCard, id: "cardId", deletedAt: timestamp } as Card;
    expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual(d);
  });

  it("should exists a card", async () => {
    expect(await firestore.card.exists("cardId")).toBeFalsy();
    await firestore.card.create(newCard);
    expect(await firestore.card.exists("cardId")).toBeTruthy();
  });
});
