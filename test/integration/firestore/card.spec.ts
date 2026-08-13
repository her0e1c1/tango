/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", "should bulk-update a card".
 */

import type { Card } from "@/entities/card";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as cardAdapter from "@/entities/card/api/firestore";
import * as studyProgressAdapter from "@/entities/study-progress/api/firestore";
import * as deckAdapter from "@/entities/deck/api/firestore";
import { getTimestamp } from "@/shared/firestore";
import * as UUID from "uuid";
import { createCard, createDeck } from "@/test/factories";

const uuid = UUID.v4;

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
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
    await deckAdapter.create(createDeck({ uid: "uid", id }));
    return id;
  };

  it("should create a card", async () => {
    const deckId = await initDeck();
    const c = {
      ...newCard,
      deckId,
      id: uuid(),
      score: 2,
      numberOfSeen: 3,
      lastSeenAt: timestamp,
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await cardAdapter.create(c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({
      ...newCard,
      deckId,
      id: c.id,
      score: 2,
      numberOfSeen: 3,
      lastSeenAt: timestamp,
    });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardAdapter.create(c);
    const n = {
      ...c,
      frontText: "updated",
      score: 4,
      numberOfSeen: 5,
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await cardAdapter.update(n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...c, frontText: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update study progress without changing Card fields", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardAdapter.create(c);

    await studyProgressAdapter.update({ cardId: c.id, score: 4, numberOfSeen: 5, lastSeenAt: timestamp });

    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual({
      ...c,
      score: 4,
      numberOfSeen: 5,
      lastSeenAt: timestamp,
    });
  });

  it("should bulk-update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardAdapter.create(c);
    const n = { ...c, frontText: "updated" };
    await cardAdapter.bulkUpdate([n]);
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(n);
  });

  it("should upsert a complete card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid(), frontText: "upserted" };

    await cardAdapter.upsert(c);

    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(c);
  });

  it("should logical-remove a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardAdapter.create(c);
    await cardAdapter.logicalRemove(c.id);
    const d = { ...c, deckId, deletedAt: timestamp } as Card;
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(d);
  });

  it("should exists a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardAdapter.create(c);
    expect(await cardAdapter.exists(c.id)).toBeTruthy();
  });
});
