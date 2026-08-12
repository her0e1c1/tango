import assert from "node:assert/strict";
import { after, before, beforeEach, describe, it } from "node:test";

import { deleteApp, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

import { commitDocumentDeletes, createDeckDeletionService, DeckOwnershipError } from "../src/deckDeletion.js";

const projectId = process.env.GCLOUD_PROJECT ?? "test-deck-deletion";
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
if (emulatorHost == null) throw new Error("FIRESTORE_EMULATOR_HOST is required");

const app = initializeApp({ projectId }, "deck-deletion-tests");
const db = getFirestore(app);

const clearFirestore = async () => {
  const response = await fetch(
    `http://${emulatorHost}/emulator/v1/projects/${projectId}/databases/(default)/documents`,
    { method: "DELETE" }
  );
  assert.equal(response.ok, true);
};

const seedDeck = async (deckId, uid = "uid") => {
  await db.collection("deck").doc(deckId).set({
    uid,
    name: deckId,
    deletedAt: null,
    createdAt: 1,
    updatedAt: 1,
  });
};

const seedCards = async (deckId, count, uid = "uid") => {
  const batch = db.batch();
  for (let index = 0; index < count; index += 1) {
    batch.set(db.collection("card").doc(`${deckId}-card-${index}`), { deckId, uid, deletedAt: null });
  }
  await batch.commit();
};

const countCards = async (deckId) => {
  const snapshot = await db.collection("card").where("deckId", "==", deckId).get();
  return snapshot.size;
};

before(async () => {
  await clearFirestore();
});

beforeEach(async () => {
  await clearFirestore();
});

after(async () => {
  await deleteApp(app);
});

describe("Deck deletion service", () => {
  for (const cardCount of [1, 2, 5]) {
    it(`deletes a Deck with ${cardCount} child Cards in bounded batches`, async () => {
      const deckId = `deck-${cardCount}`;
      await seedDeck(deckId);
      await seedCards(deckId, cardCount);
      const service = createDeckDeletionService({ db, batchSize: 2 });

      const result = await service.deleteDeck(deckId, "uid");

      assert.deepEqual(result, { status: "completed", deletedCards: cardCount });
      assert.equal((await db.collection("deck").doc(deckId).get()).exists, false);
      assert.equal(await countCards(deckId), 0);
    });
  }

  it("resumes after a partially committed cleanup", async () => {
    const deckId = "partial";
    await seedDeck(deckId);
    await seedCards(deckId, 5);
    let commits = 0;
    const interrupted = createDeckDeletionService({
      db,
      batchSize: 2,
      deleteDocuments: async (references) => {
        commits += 1;
        if (commits === 2) throw new Error("transient batch failure");
        await commitDocumentDeletes(db, references);
      },
    });

    await assert.rejects(interrupted.deleteDeck(deckId, "uid"), /transient batch failure/);
    assert.equal((await db.collection("deck").doc(deckId).get()).data().deletionState, "deleting");
    assert.equal(await countCards(deckId), 3);

    const result = await createDeckDeletionService({ db, batchSize: 2 }).deleteDeck(deckId, "uid");

    assert.deepEqual(result, { status: "completed", deletedCards: 3 });
    assert.equal(await countCards(deckId), 0);
    assert.equal((await db.collection("deck").doc(deckId).get()).exists, false);
  });

  it("is idempotent when independent workers delete the same Deck", async () => {
    const deckId = "concurrent";
    await seedDeck(deckId);
    await seedCards(deckId, 5);
    const first = createDeckDeletionService({ db, batchSize: 2 });
    const second = createDeckDeletionService({ db, batchSize: 2 });

    const results = await Promise.all([first.deleteDeck(deckId, "uid"), second.deleteDeck(deckId, "uid")]);

    assert.equal(
      results.every((result) => result.status === "completed"),
      true
    );
    assert.equal(await countCards(deckId), 0);
    assert.equal((await db.collection("deck").doc(deckId).get()).exists, false);
    assert.deepEqual(await first.deleteDeck(deckId, "uid"), { status: "completed", deletedCards: 0 });
  });

  it("rejects a non-owner before changing deletion state", async () => {
    await seedDeck("owned", "owner");
    const service = createDeckDeletionService({ db });

    await assert.rejects(service.deleteDeck("owned", "other"), DeckOwnershipError);

    const deck = (await db.collection("deck").doc("owned").get()).data();
    assert.equal(deck.deletionState, undefined);
    assert.equal(deck.deletedAt, null);
  });
});
