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

describe("firestore/deck", () => {
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = {
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  } as unknown as Deck;
  const newCard = {
    frontText: "front",
    backText: "back",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as Card;

  beforeEach(async () => {
    vi.resetAllMocks();
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

  it("should create a deck", async () => {
    await firestore.deck.create(newDeck, [newCard]);
    const d = { ...newDeck, id: "deckId" } as Deck;
    const c = { ...newCard, id: "cardId", deckId: "deckId" } as Card;
    expect((await getDoc(doc(db, "deck", d.id))).data()).toEqual(d);
    expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual(c);
  });

  it("should update a deck", async () => {
    await firestore.deck.create(newDeck, []);
    const d = { ...newDeck, id: "deckId", name: "updated" };
    await firestore.deck.update(d);
    expect((await getDoc(doc(db, "deck", d.id))).data()).toEqual(d);
  });

  it("should delete a deck", async () => {
    expect((await getDoc(doc(db, "deck", "deckId"))).exists()).toBeFalsy();
    expect((await getDoc(doc(db, "card", "cardId"))).exists()).toBeFalsy();
    await firestore.deck.create(newDeck, [newCard]);
    expect((await getDoc(doc(db, "deck", "deckId"))).exists()).toBeTruthy();
    expect((await getDoc(doc(db, "card", "cardId"))).exists()).toBeTruthy();
    await firestore.deck.remove("deckId", "uid");
    expect((await getDoc(doc(db, "deck", "deckId"))).exists()).toBeFalsy();
    expect((await getDoc(doc(db, "card", "cardId"))).exists()).toBeFalsy();
  });

  it("should exists a deck", async () => {
    expect(await firestore.deck.exists("deckId")).toBeFalsy();
    await firestore.deck.create(newDeck, []);
    expect(await firestore.deck.exists("deckId")).toBeTruthy();
  });

  describe("splitCards", () => {
    const cards = [...Array(5)].map((_, i) => ({ id: String(i) })) as Card[];

    it("should split cards (max) = (5)", async () => {
      const css = firestore.deck.splitCards(cards, 5);
      expect(css).toEqual([cards]);
    });

    it("should split cards (max) = (3)", async () => {
      const css = firestore.deck.splitCards(cards, 3);
      expect(css).toEqual([cards.slice(0, 3), cards.slice(3, 5)]);
    });

    it("should split cards (max) = (2)", async () => {
      const css = firestore.deck.splitCards(cards, 2);
      expect(css).toEqual([cards.slice(0, 2), cards.slice(2, 4), cards.slice(4, 5)]);
    });

    it("should be empty cards", async () => {
      expect(firestore.deck.splitCards(cards, 0)).toEqual([]);
      expect(firestore.deck.splitCards([], 5)).toEqual([]);
    });
  });
});
