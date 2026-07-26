/** @file Exposes Tango's trusted Firebase callable functions. */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { HttpsError, onCall } from "firebase-functions/v2/https";
import { error as logError } from "firebase-functions/logger";

import { createFirestoreDeckDeletionStore, DeckDeletionError, deleteDeckForUser } from "./deleteDeck.js";

initializeApp();
const deckDeletionStore = createFirestoreDeckDeletionStore(getFirestore());

export const deleteDeck = onCall({ timeoutSeconds: 540, memory: "256MiB" }, async (request) => {
  const uid = request.auth?.uid;
  if (uid == null) throw new HttpsError("unauthenticated", "Authentication is required");

  try {
    return await deleteDeckForUser({
      store: deckDeletionStore,
      deckId: request.data?.deckId,
      uid,
    });
  } catch (error) {
    if (error instanceof DeckDeletionError) throw new HttpsError(error.code, error.message);
    logError("deleteDeck failed", error);
    throw new HttpsError("internal", "Deck deletion failed");
  }
});
