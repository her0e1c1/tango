/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck, DeckCreateInput } from "@/entities/deck";

import "@/test/initializeTestFirestore";
import { expect, it, describe, vi, beforeEach, type Mock } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createCard as createCardCommand } from "@/features/card/create";
import { createDeck } from "@/features/deck/create";
import { deleteDeck } from "@/features/deck/delete/api/deleteDeck";
import { editDeck } from "@/features/deck/edit/api/editDeck";
import { getTimestamp } from "@/shared/firestore";
import * as UUID from "uuid";
import { createCard, createDeck as createDeckFixture } from "@/test/factories";

const uuid = UUID.v4;

vi.mock("@/shared/firestore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/firestore")>()),
  getTimestamp: vi.fn(),
}));
vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe.concurrent("firestore/deck", { retry: 3 }, () => {
  const db = getFirestore();
  const timestamp = new Date(2013, 10, 9).getTime();
  const newDeck = createDeckFixture({
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
      id: uuid(),
      uid: "uid",
      name: "new deck name",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies DeckCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...newDeck, id: d.id });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBe(true);
  });

  it("should update a deck", async () => {
    const d = { ...newDeck, id: uuid() };
    await createDeck("uid", d);
    const n = {
      ...d,
      name: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies Deck & { currentIndex: number; cardOrderIds: string[] };
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...d, name: "updated" });
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("should delete a deck and its Cards", async () => {
    const d = { ...newDeck, id: uuid() };
    const cards = [
      createCard({ id: uuid(), deckId: d.id, uid: d.uid }),
      createCard({ id: uuid(), deckId: d.id, uid: d.uid }),
    ];
    await createDeck("uid", d);
    await Promise.all(cards.map((card) => createCardCommand("uid", card)));

    await deleteDeck("uid", d);

    await expect(getDoc(doc(db, "deck", d.id))).rejects.toMatchObject({ code: "permission-denied" });
    for (const card of cards) {
      await expect(getDoc(doc(db, "card", card.id))).rejects.toMatchObject({ code: "permission-denied" });
    }
  });
});
