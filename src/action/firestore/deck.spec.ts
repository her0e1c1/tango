import "./init";
import { expect, it, describe, vi, beforeEach, Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import * as firestore from ".";
import { getTimestamp } from "./mocked";
import { v4 as uuid } from "uuid";

vi.mock("./mocked", async (importOriginal) => ({
  ...((await importOriginal()) as any),
  getTimestamp: vi.fn(),
}));

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = {
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  } as unknown as Deck;

  beforeEach(async () => {
    // must return the same value (no need to reset mock in parallel)
    (getTimestamp as Mock).mockReturnValue(timestamp);
  });

  it("should create a deck and check if exists", async () => {
    const d = { ...newDeck, id: uuid() };
    await firestore.deck.create(d);
    expect((await getDoc(doc(db, "deck", d.id))).data()).toEqual(d);
    expect(await firestore.deck.exists(d.id)).toBeTruthy();
  });

  it("should update a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await firestore.deck.create(d);
    const n = { ...d, name: "updated" };
    await firestore.deck.update(n);
    expect((await getDoc(doc(db, "deck", d.id))).data()).toEqual(n);
  });

  it("should delete a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await firestore.deck.create(d);
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBeTruthy();
    await firestore.deck.remove(d.id, "uid");
    // getDoc can not be called here because of permission error
    expect(await firestore.deck.exists(d.id)).toBeFalsy();
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
