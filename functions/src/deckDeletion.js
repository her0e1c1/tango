const DELETING = "deleting";
const DEFAULT_BATCH_SIZE = 400;

export class DeckOwnershipError extends Error {}

export const commitDocumentDeletes = async (db, references) => {
  const batch = db.batch();
  for (const reference of references) batch.delete(reference);
  await batch.commit();
};

export const createDeckDeletionService = ({
  db,
  batchSize = DEFAULT_BATCH_SIZE,
  now = Date.now,
  deleteDocuments = (references) => commitDocumentDeletes(db, references),
}) => {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500) {
    throw new RangeError("Deck deletion batch size must be an integer from 1 to 500");
  }

  const beginDeletion = async (deckId, uid) => {
    const deckRef = db.collection("deck").doc(deckId);
    return db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(deckRef);
      if (!snapshot.exists) return "completed";
      if (snapshot.data().uid !== uid) throw new DeckOwnershipError();
      if (snapshot.data().deletionState !== DELETING) {
        const deletedAt = now();
        transaction.update(deckRef, {
          deletedAt,
          deletionState: DELETING,
          updatedAt: deletedAt,
        });
      }
      return DELETING;
    });
  };

  const deleteChildCards = async (deckId) => {
    let deletedCards = 0;
    let snapshot = await db.collection("card").where("deckId", "==", deckId).limit(batchSize).get();
    while (!snapshot.empty) {
      await deleteDocuments(snapshot.docs.map((document) => document.ref));
      deletedCards += snapshot.size;
      snapshot = await db.collection("card").where("deckId", "==", deckId).limit(batchSize).get();
    }
    return deletedCards;
  };

  const finishDeletion = async (deckId, uid) => {
    const deckRef = db.collection("deck").doc(deckId);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(deckRef);
      if (!snapshot.exists) return;
      const deck = snapshot.data();
      if (deck.uid !== uid) throw new DeckOwnershipError();
      if (deck.deletionState !== DELETING) {
        throw new Error("Deck deletion state changed before cleanup completed");
      }
      transaction.delete(deckRef);
    });
  };

  const deleteDeck = async (deckId, uid) => {
    const state = await beginDeletion(deckId, uid);
    if (state === "completed") return { status: "completed", deletedCards: 0 };
    const deletedCards = await deleteChildCards(deckId);
    await finishDeletion(deckId, uid);
    return { status: "completed", deletedCards };
  };

  return { beginDeletion, deleteDeck };
};
