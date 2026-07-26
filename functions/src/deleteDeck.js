/** @file Implements an idempotent Deck deletion use case behind a trusted server boundary. */

export class DeckDeletionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "DeckDeletionError";
    this.code = code;
  }
}

/**
 * Deletes one Deck and every child Card. The store first marks the Deck as deleting, which lets
 * Security Rules reject concurrent client writes. Re-running after any partial failure resumes
 * from the remaining Cards and treats an already-missing Deck as success.
 */
export const deleteDeckForUser = async ({ store, deckId, uid, batchSize = 400 }) => {
  if (typeof deckId !== "string" || deckId.length === 0) {
    throw new DeckDeletionError("invalid-argument", "deckId is required");
  }
  if (typeof uid !== "string" || uid.length === 0) {
    throw new DeckDeletionError("unauthenticated", "Authentication is required");
  }

  const claim = await store.claimDeckDeletion(deckId, uid);
  if (claim === "missing") return { deleted: true, deletedCards: 0, alreadyMissing: true };

  let deletedCards = 0;
  while (true) {
    const cardIds = await store.listCardIds(deckId, batchSize);
    if (cardIds.length === 0) break;
    await store.deleteCards(cardIds);
    deletedCards += cardIds.length;
  }

  await store.deleteDeck(deckId);
  return { deleted: true, deletedCards, alreadyMissing: false };
};

/** Creates the Firestore operations used by the pure deletion workflow. */
export const createFirestoreDeckDeletionStore = (db) => ({
  claimDeckDeletion: async (deckId, uid) =>
    db.runTransaction(async (transaction) => {
      const deckRef = db.collection("deck").doc(deckId);
      const snapshot = await transaction.get(deckRef);
      if (!snapshot.exists) return "missing";
      const deck = snapshot.data();
      if (deck?.uid !== uid) throw new DeckDeletionError("permission-denied", "The Deck is owned by another user");
      if (deck.deletionState !== "deleting") {
        const timestamp = Date.now();
        transaction.update(deckRef, {
          deletionState: "deleting",
          deletedAt: timestamp,
          updatedAt: timestamp,
        });
      }
      return "claimed";
    }),
  listCardIds: async (deckId, batchSize) => {
    const snapshot = await db.collection("card").where("deckId", "==", deckId).limit(batchSize).get();
    return snapshot.docs.map((document) => document.id);
  },
  deleteCards: async (cardIds) => {
    const batch = db.batch();
    for (const cardId of cardIds) batch.delete(db.collection("card").doc(cardId));
    await batch.commit();
  },
  deleteDeck: async (deckId) => {
    await db.collection("deck").doc(deckId).delete();
  },
});
