import "./init";

import { expect, it, describe, vi, beforeEach, Mock } from "vitest";

import { getApps, deleteApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator, getDoc, doc } from "firebase/firestore";

import * as firestore from ".";
import { generateDeckId, generateCardId, getTimestamp } from "./mocked";

const db = getFirestore();
connectFirestoreEmulator(db, process.env.VITE_DB_HOST, parseInt(process.env.VITE_DB_PORT));

vi.mock("./mocked", () => ({
  generateDeckId: vi.fn(),
  generateCardId: vi.fn(),
  getTimestamp: vi.fn(),
}));

describe.skip("firestore/event", () => {
  const timestamp = new Date(2013, 10, 9).getTime();

  const newDeck = {
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  } as unknown as Deck;

  const newCard = {
    frontText: "front text",
    backText: "back text",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
  } as Card;

  beforeEach(async () => {
    vi.resetAllMocks();
    (generateDeckId as Mock).mockReturnValue("deckId");
    (generateCardId as Mock).mockReturnValue("cardId");
    await firestore.deck.removeAll();
  });

  afterAll(async () => {
    await Promise.all(
      getApps().map(async (app) => {
        await deleteApp(app);
      })
    );
  });

  describe("deck", () => {
    const deckEvent = { added: [], modified: [], removed: [], metadata: { size: 1, fromLocal: true } };

    it("should create a insert event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: timestamp - 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      expect(fn).toBeCalledTimes(1);
      const d = { ...newDeck, id: "deckId" } as Deck;
      expect(fn).lastCalledWith({ ...deckEvent, added: [d] });
    });

    it("should not create a insert event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      expect(fn).toBeCalledTimes(0);
    });

    it("should create a update event", async () => {
      (getTimestamp as Mock).mockReturnValueOnce(100).mockReturnValueOnce(200);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: 0,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, []);
      const deckCreated = { ...newDeck, uid: "uid", id: "deckId", createdAt: 100, updatedAt: 100 };
      expect((await getDoc(doc(db, "deck", "deckId"))).data()).toEqual(deckCreated);
      await firestore.deck.update({ ...deckCreated, name: "updated" });
      const deckUpdated = {
        ...newDeck,
        id: "deckId",
        name: "updated",
        createdAt: 100,
        updatedAt: 200,
      };
      expect((await getDoc(doc(db, "deck", "deckId"))).data()).toEqual(deckUpdated);
      expect(getTimestamp).toBeCalledTimes(2);
      expect(fn).toBeCalledTimes(2);
      expect(fn).lastCalledWith({ ...deckEvent, modified: [deckUpdated] });
    });

    it("should not create a update event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, []);
      const d = { ...newDeck, id: "deckId", name: "updated" } as Deck;
      await firestore.deck.update(d);
      expect(fn).toBeCalledTimes(0);
    });

    it("should create a delete event", async () => {
      (getTimestamp as Mock).mockReturnValueOnce(100).mockReturnValueOnce(200);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: 0,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, []);
      const deckCreated = { ...newDeck, uid: "uid", id: "deckId", createdAt: 100, updatedAt: 100 };
      expect((await getDoc(doc(db, "deck", "deckId"))).data()).toEqual(deckCreated);
      expect(fn).toBeCalledTimes(1);
      await firestore.deck.remove("deckId", "uid");
      expect(await firestore.deck.exists("deckId")).toBeFalsy();
      expect(fn).toBeCalledTimes(2);
      expect(fn).lastCalledWith({ ...deckEvent, removed: ["deckId"], metadata: { size: 1, fromLocal: false } });
    });

    it("should not create a delete event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeDeck({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, []);
      await firestore.deck.remove("deckId", "uid");
      expect(fn).toBeCalledTimes(0);
    });
  });

  describe("card", () => {
    const cardEvent = { added: [], modified: [], removed: [], metadata: { size: 1, fromLocal: true } };

    it("should create a insert event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: timestamp - 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      expect(fn).toBeCalledTimes(1);
      const c = { ...newCard, id: "cardId", deckId: "deckId" } as Card;
      expect(fn).lastCalledWith({ ...cardEvent, added: [c] });
    });

    it("should not create a insert event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      expect(fn).toBeCalledTimes(0);
    });

    it("should create a update event", async () => {
      (getTimestamp as Mock).mockReturnValueOnce(100).mockReturnValueOnce(200);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: 0,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      const cardCreated = { ...newCard, uid: "uid", id: "cardId", deckId: "deckId", createdAt: 100, updatedAt: 100 };
      expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual(cardCreated);
      await firestore.card.update({ ...cardCreated, frontText: "updated" });
      const cardUpdated = {
        ...newCard,
        id: "cardId",
        deckId: "deckId",
        frontText: "updated",
        createdAt: 100,
        updatedAt: 200,
      };
      expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual(cardUpdated);
      expect(getTimestamp).toBeCalledTimes(2);
      expect(fn).toBeCalledTimes(2);
      expect(fn).lastCalledWith({ ...cardEvent, modified: [cardUpdated] });
    });

    it("should create a update event for logical remove", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: 0,
        onCange: fn,
      });
      await firestore.card.create(newCard);
      expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual({ ...newCard, id: "cardId" });
      await firestore.card.logicalRemove("cardId");
      expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual({
        ...newCard,
        id: "cardId",
        deletedAt: timestamp,
      });
      expect(getTimestamp).toBeCalledTimes(2);
      expect(fn).toBeCalledTimes(2);
      expect(fn).lastCalledWith({ ...cardEvent, removed: ["cardId"], metadata: { size: 1, fromLocal: true } });
    });

    it("should not create a update event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      await firestore.card.update({ ...newCard, id: "cardId", frontText: "updated" });
      expect(fn).toBeCalledTimes(0);
    });

    it("should create a delete event", async () => {
      (getTimestamp as Mock).mockReturnValueOnce(100).mockReturnValueOnce(200);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: 0,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      const cardCreated = { ...newCard, id: "cardId", deckId: "deckId", createdAt: 100, updatedAt: 100 };
      expect((await getDoc(doc(db, "card", "cardId"))).data()).toEqual(cardCreated);
      expect(fn).toBeCalledTimes(1);
      await firestore.card.remove("cardId");
      expect(await firestore.card.exists("cardId")).toBeFalsy();
      expect(fn).toBeCalledTimes(2);
      expect(fn).lastCalledWith({ ...cardEvent, removed: ["cardId"], metadata: { size: 1, fromLocal: false } });
    });

    it("should not create a delete event", async () => {
      (getTimestamp as Mock).mockReturnValue(timestamp);
      const fn = vi.fn();
      firestore.event.subscribeCard({
        uid: "uid",
        updatedAt: timestamp + 1,
        onCange: fn,
      });
      await firestore.deck.create(newDeck, [newCard]);
      const deckCreated = {
        ...newDeck,
        uid: "uid",
        id: "deckId",
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      expect((await getDoc(doc(db, "deck", "deckId"))).data()).toEqual(deckCreated);
      await firestore.card.remove("cardId");
      expect(fn).toBeCalledTimes(0);
    });
  });
});
