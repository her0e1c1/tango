/** @file Calls the trusted server boundary for idempotent Deck deletion. */

import { connectFunctionsEmulator, getFunctions, httpsCallable, type HttpsCallable } from "firebase/functions";

interface DeleteDeckRequest {
  deckId: DeckId;
}

interface DeleteDeckResponse {
  deleted: boolean;
  deletedCards: number;
  alreadyMissing: boolean;
}

let deleteDeckCallable: Promise<HttpsCallable<DeleteDeckRequest, DeleteDeckResponse>> | undefined;

const getDeleteDeckCallable = () => {
  deleteDeckCallable ??= import("@/firebase").then(({ app }) => {
    const functions = getFunctions(app);
    const host = import.meta.env.VITE_FUNCTIONS_HOST;
    const port = Number.parseInt(import.meta.env.VITE_FUNCTIONS_PORT, 10);
    if (import.meta.env.DEV && host !== "" && Number.isFinite(port)) {
      connectFunctionsEmulator(functions, host, port);
    }
    return httpsCallable<DeleteDeckRequest, DeleteDeckResponse>(functions, "deleteDeck");
  });
  return deleteDeckCallable;
};

/** Requests server-side deletion and resolves only after Cards and Deck are fully removed. */
export const removeDeck = async (deckId: DeckId): Promise<void> => {
  const callable = await getDeleteDeckCallable();
  await callable({ deckId });
};
