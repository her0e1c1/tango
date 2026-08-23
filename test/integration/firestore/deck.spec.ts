/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { DeckCreateInput } from "@/entities/deck";
import type { RemoteDeck } from "@/entities/deck/testing";

import "@/test/initializeTestFirestore";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createCard as createCardCommand } from "@/entities/card/api/firestore";
import { cardStore } from "@/entities/card/model/store";
import { createDeck, deleteDeck, editDeck } from "@/entities/deck/api/firestore";
import { editDeck as editStoredDeck } from "@/entities/deck";
import { deckStore } from "@/entities/deck/model/store";
import { getCurrentTimeMillis } from "@/shared/lib/currentTime";
import * as Uuid from "uuid";
import { createCard, createDeck as createDeckFixture, createLocalCard, createLocalDeck } from "@/test/factories";

const uuid = Uuid.v4;

const toFirestoreDeck = ({ localMode: _localMode, ...deck }: RemoteDeck) => ({
  ...deck,
  deletedAt: null,
});

vi.mock("@/shared/lib/currentTime", () => ({ getCurrentTimeMillis: vi.fn() }));
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

  beforeEach(() => {
    // must return the same value (no need to reset mock in parallel)
    (getCurrentTimeMillis as Mock).mockReturnValue(timestamp);
  });

  it("should create a deck and check if exists", async () => {
    const d = {
      id: uuid(),
      name: "new deck name",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies DeckCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...toFirestoreDeck(newDeck), id: d.id });
    expect(data).not.toHaveProperty("localMode");
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
    } satisfies RemoteDeck & { currentIndex: number; cardOrderIds: string[] };
    await editDeck("uid", d, n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...toFirestoreDeck(d), name: "updated" });
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("preserves an omitted URL and removes a cleared URL", async () => {
    const deck = { ...newDeck, id: uuid(), url: "https://example.com/deck" };
    await createDeck("uid", deck);

    await editDeck("uid", deck, { id: deck.id, name: "updated" });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({ url: deck.url });

    await editDeck("uid", deck, { id: deck.id, url: null });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).not.toHaveProperty("url");
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
    await Promise.all(
      cards.map((card) => expect(getDoc(doc(db, "card", card.id))).rejects.toMatchObject({ code: "permission-denied" }))
    );
  });

  it("moves a local Deck and its Cards to Firestore when local mode is disabled", async () => {
    const deck = createLocalDeck({ id: uuid(), name: "Local Deck" });
    const cards = [
      createLocalCard({ id: uuid(), deckId: deck.id, frontText: "first" }),
      createLocalCard({ id: uuid(), deckId: deck.id, frontText: "second" }),
    ];
    deckStore.setState({ localDecks: [deck] });
    cardStore.setState({ localCards: cards });

    await editStoredDeck("uid", { id: deck.id, name: "Synced Deck", localMode: false });

    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({
      id: deck.id,
      uid: "uid",
      name: "Synced Deck",
    });
    await Promise.all(
      cards.map(async (card) => {
        expect((await getDoc(doc(db, "card", card.id))).data()).toMatchObject({
          id: card.id,
          deckId: deck.id,
          uid: "uid",
          frontText: card.frontText,
        });
      })
    );
    expect(deckStore.getState().localDecks).not.toContainEqual(expect.objectContaining({ id: deck.id }));
    expect(cardStore.getState().localCards).not.toContainEqual(expect.objectContaining({ deckId: deck.id }));
  });
});
