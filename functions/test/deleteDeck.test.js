/** @file Verifies idempotent Deck deletion, partial-failure recovery, and write exclusion. */

import assert from "node:assert/strict";
import test from "node:test";

import { DeckDeletionError, deleteDeckForUser } from "../src/deleteDeck.js";

const createStore = ({ owner = "user-1", cards = [] } = {}) => {
  let deckExists = true;
  let deleting = false;
  const cardIds = new Set(cards);

  return {
    state: () => ({ deckExists, deleting, cards: [...cardIds] }),
    addCard: (id) => {
      if (deleting || !deckExists) throw new Error("Deck is deleting");
      cardIds.add(id);
    },
    claimDeckDeletion: async (_deckId, uid) => {
      if (!deckExists) return "missing";
      if (uid !== owner) throw new DeckDeletionError("permission-denied", "wrong owner");
      deleting = true;
      return "claimed";
    },
    listCardIds: async (_deckId, batchSize) => [...cardIds].slice(0, batchSize),
    deleteCards: async (ids) => {
      for (const id of ids) cardIds.delete(id);
    },
    deleteDeck: async () => {
      assert.equal(cardIds.size, 0, "Deck must not be removed while Cards remain");
      deckExists = false;
    },
  };
};

test("deletes child Cards in batches before the Deck", async () => {
  const store = createStore({ cards: ["a", "b", "c", "d", "e"] });

  const result = await deleteDeckForUser({ store, deckId: "deck-1", uid: "user-1", batchSize: 2 });

  assert.deepEqual(result, { deleted: true, deletedCards: 5, alreadyMissing: false });
  assert.deepEqual(store.state(), { deckExists: false, deleting: true, cards: [] });
});

test("resumes after a partial Card batch failure without leaving orphans", async () => {
  const store = createStore({ cards: ["a", "b", "c"] });
  const originalDeleteCards = store.deleteCards;
  let failOnce = true;
  store.deleteCards = async (ids) => {
    if (failOnce) {
      failOnce = false;
      await originalDeleteCards(ids.slice(0, 1));
      throw new Error("injected batch failure");
    }
    await originalDeleteCards(ids);
  };

  await assert.rejects(deleteDeckForUser({ store, deckId: "deck-1", uid: "user-1", batchSize: 2 }));
  assert.deepEqual(store.state(), { deckExists: true, deleting: true, cards: ["b", "c"] });
  assert.throws(() => store.addCard("new"), /deleting/);

  const retry = await deleteDeckForUser({ store, deckId: "deck-1", uid: "user-1", batchSize: 2 });

  assert.deepEqual(retry, { deleted: true, deletedCards: 2, alreadyMissing: false });
  assert.deepEqual(store.state(), { deckExists: false, deleting: true, cards: [] });
});

test("treats an already-missing Deck as a successful retry", async () => {
  const store = createStore();
  await deleteDeckForUser({ store, deckId: "deck-1", uid: "user-1" });

  const retry = await deleteDeckForUser({ store, deckId: "deck-1", uid: "user-1" });

  assert.deepEqual(retry, { deleted: true, deletedCards: 0, alreadyMissing: true });
});

test("rejects a caller who does not own the Deck", async () => {
  const store = createStore({ owner: "owner" });

  await assert.rejects(
    deleteDeckForUser({ store, deckId: "deck-1", uid: "other" }),
    (error) => error instanceof DeckDeletionError && error.code === "permission-denied"
  );
});
