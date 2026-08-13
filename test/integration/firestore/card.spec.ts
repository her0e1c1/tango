/**
 * @file Verifies the "card" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a card",
 * "should update a card", and "should import cards".
 */

import type { Card } from "@/entities/card";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { cardCommands } from "@/features/card/api/cardCommands";
import { createDeck as createDeckCommand } from "@/features/deck/create";
import { upsertImportedCards } from "@/features/import/api/upsertImportedCards";
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
    await createDeckCommand("uid", createDeck({ uid: "uid", id }));
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
    await cardCommands.create("uid", c);
    const data = (await getDoc(doc(db, "card", c.id))).data();
    expect(data).toEqual({ ...newCard, deckId, id: c.id });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should update a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardCommands.create("uid", c);
    const n = {
      ...c,
      frontText: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Card & { currentIndex: number; cardOrderIds: string[] };
    await cardCommands.update("uid", n);
    const data = (await getDoc(doc(db, "card", n.id))).data();
    expect(data).toEqual({ ...c, frontText: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should upsert a complete card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid(), frontText: "upserted" };

    await upsertImportedCards("uid", [c]);

    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(c);
  });

  it("reports failed imported Cards while persisting valid Cards", async () => {
    const deckId = await initDeck();
    const valid = { ...newCard, deckId, id: uuid(), frontText: "valid" };
    const invalid = { ...newCard, deckId, id: uuid(), frontText: 42 } as unknown as Card;

    await expect(upsertImportedCards("uid", [valid, invalid])).rejects.toMatchObject({
      failedIds: [invalid.id],
      message: "1 of 2 Card writes failed",
    });

    expect((await getDoc(doc(db, "card", valid.id))).data()).toEqual(valid);
  });

  it("should logical-remove a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardCommands.create("uid", c);
    await cardCommands.remove("uid", c.id);
    const d = { ...c, deckId, deletedAt: timestamp } as Card;
    expect((await getDoc(doc(db, "card", c.id))).data()).toEqual(d);
  });

  it("should exists a card", async () => {
    const deckId = await initDeck();
    const c = { ...newCard, deckId, id: uuid() };
    await cardCommands.create("uid", c);
    expect((await getDoc(doc(db, "card", c.id))).exists()).toBe(true);
  });
});
