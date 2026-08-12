/**
 * @file Verifies the "splitCards" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "should create a deck and
 * check if exists", "should update a deck", "should delete a deck".
 */

import type { Deck } from "../model/deck";

import "@/test/firestore/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { getTimestamp } from "@/shared/firestore";
import * as UUID from "uuid";
import { createDeck } from "@/test/factories";
import * as deckAdapter from "./firestore";

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
});
