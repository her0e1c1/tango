import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onCall } from "firebase-functions/v2/https";

import { createDeckDeletionService } from "./deckDeletion.js";
import { createDeleteDeckHandler } from "./deleteDeckRequest.js";

if (getApps().length === 0) initializeApp();

const deletionService = createDeckDeletionService({ db: getFirestore() });

export const deleteDeck = onCall(createDeleteDeckHandler(deletionService));

export const resumeDeckDeletion = onDocumentUpdated({ document: "deck/{deckId}", retry: true }, async (event) => {
  const deck = event.data?.after.data();
  const deckId = event.params.deckId;
  if (deck?.deletionState !== "deleting" || typeof deck.uid !== "string") return;
  await deletionService.deleteDeck(deckId, deck.uid);
});
