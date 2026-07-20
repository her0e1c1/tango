/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", "should bulk-update a card".
 */

import "./init";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import * as cardAdapter from "@/adapters/firestore/card";
import * as deckAdapter from "@/adapters/firestore/deck";
import { getTimestamp } from "@/adapters/firestore/documentMetadata";
import { v4 as uuid } from "uuid";
import { createCard, createDeck } from "@/test/factories";

vi.mock("./documentMetadata", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./documentMetadata")>()),
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
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await cardAdapter.create(c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...newCard, deckId, id: c.id });
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
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await cardAdapter.update(n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...c, frontText: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
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
