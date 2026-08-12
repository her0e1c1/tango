import { HttpsError } from "firebase-functions/v2/https";

import { DeckOwnershipError } from "./deckDeletion.js";

export const createDeleteDeckHandler = (service) => async (request) => {
  const uid = request.auth?.uid;
  if (uid == null) throw new HttpsError("unauthenticated", "Authentication is required");

  const deckId = request.data?.deckId;
  if (typeof deckId !== "string" || deckId.trim() === "") {
    throw new HttpsError("invalid-argument", "A Deck ID is required");
  }

  try {
    return await service.deleteDeck(deckId, uid);
  } catch (error) {
    if (error instanceof DeckOwnershipError) {
      throw new HttpsError("permission-denied", "Only the Deck owner can delete it");
    }
    throw error;
  }
};
