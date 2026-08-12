/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck } from "@/entities/deck";

import "@/shared/firebase/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import * as deckAdapter from "@/entities/deck/api/firestore";
import { getTimestamp } from "@/shared/firestore";
import * as UUID from "uuid";
import { createDeck } from "@/test/factories";

const uuid = UUID.v4;

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getTimestamp: vi.fn(),
}));

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = createDeck({
    name: "new deck name",
    uid: "uid",
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  beforeEach(async () => {
    // must return the same value (no need to reset mock in parallel)
    (getTimestamp as Mock).mockReturnValue(timestamp);
  });

  it("should create a deck and check if exists", async () => {
    const d = {
      ...newDeck,
      id: uuid(),
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };
    await deckAdapter.create(d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...newDeck, id: d.id });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect(await deckAdapter.exists(d.id)).toBeTruthy();
  });

  it("should update a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await deckAdapter.create(d);
    const n = {
      ...d,
      name: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };
    await deckAdapter.update(n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...d, name: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should delete a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await deckAdapter.create(d);
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBeTruthy();
    await deckAdapter.remove(d.id, "uid");
    await expect(deckAdapter.exists(d.id)).rejects.toMatchObject({ code: "permission-denied" });
  });
});
