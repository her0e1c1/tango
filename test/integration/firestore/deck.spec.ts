/**
 * @file Verifies Deck persistence with automated examples.
 * The examples cover creating, updating, checking, and deleting Deck documents.
 */

import type { Deck, RemoteDeckCreateInput } from "@/entities/deck";

import "@/test/initializeTestFirestore";
import { describe, expect, it, vi } from "vitest";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { createCard as createCardCommand } from "@/entities/card/api/firestore";
import { cardStore } from "@/entities/card/model/store";
import { createDeck, deleteDeck, editDeck } from "@/entities/deck/api/firestore";
import { editDeck as editStoredDeck } from "@/entities/deck";
import { deckStore } from "@/entities/deck/model/store";
import * as Uuid from "uuid";
import {
  createCard,
  createDeck as createDeckFixture,
  createLocalCard,
  createLocalDeck,
  createRemoteDeckInput,
} from "@/test/factories";

const uuid = Uuid.v4;

const toFirestoreDeck = ({ localMode: _localMode, ...deck }: Extract<Deck, { localMode: false }>) => ({
  ...deck,
  deletedAt: null,
});

vi.mock("@/shared/firebase", async () => ({
  db: (await import("@/test/initializeTestFirestore")).testDb,
}));

describe.concurrent("firestore/deck [CARD-10]", { retry: 3 }, () => {
  const db = getFirestore();
  const newDeck = createDeckFixture({
    name: "new deck name",
    uid: "uid",
    difficultyMax: 10,
    difficultyMin: 1,
    createdAt: 0,
    updatedAt: 0,
  });

  it("should create a deck and check if exists", async () => {
    const d = {
      id: uuid(),
      name: "new deck name",
      localMode: false,
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    } satisfies RemoteDeckCreateInput & { currentIndex: number; cardOrderIds: string[] };
    await createDeck("uid", d);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({
      ...toFirestoreDeck(newDeck),
      id: d.id,
      createdAt: expect.any(Number),
      updatedAt: expect.any(Number),
    });
    expect(data?.createdAt).toBe(data?.updatedAt);
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
    expect((await getDoc(doc(db, "deck", d.id))).exists()).toBe(true);
  });

  it("should update a deck", async () => {
    const d = createRemoteDeckInput({ id: uuid(), name: newDeck.name });
    await createDeck("uid", d);
    const created = (await getDoc(doc(db, "deck", d.id))).data();
    if (created === undefined) throw new Error("Created Deck was not found");
    const n = {
      ...d,
      name: "updated",
      currentIndex: 1,
      cardOrderIds: ["card-1"],
    };
    await editDeck("uid", n);
    const data = (await getDoc(doc(db, "deck", d.id))).data();
    expect(data).toEqual({ ...created, name: "updated", updatedAt: expect.any(Number) });
    expect(data?.createdAt).toBe(created.createdAt);
    expect(data).not.toHaveProperty("localMode");
    expect(data).not.toHaveProperty("currentIndex");
    expect(data).not.toHaveProperty("cardOrderIds");
  });

  it("preserves an omitted URL and removes a cleared URL", async () => {
    const deck = createRemoteDeckInput({
      id: uuid(),
      name: newDeck.name,
      url: "https://example.com/deck",
    });
    await createDeck("uid", deck);

    await editDeck("uid", { id: deck.id, name: "updated" });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).toMatchObject({ url: deck.url });

    await editDeck("uid", { id: deck.id, url: null });
    expect((await getDoc(doc(db, "deck", deck.id))).data()).not.toHaveProperty("url");
  });

  it("should delete a deck and its Cards", async () => {
    const d = createRemoteDeckInput({ id: uuid(), name: newDeck.name });
    const cards = [
      createCard({ id: uuid(), deckId: d.id, uid: "uid" }),
      createCard({ id: uuid(), deckId: d.id, uid: "uid" }),
    ];
    await createDeck("uid", d);
    await Promise.all(cards.map((card) => createCardCommand("uid", card)));

    await deleteDeck("uid", d.id);

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
