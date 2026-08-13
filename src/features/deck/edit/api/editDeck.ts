import type { DeckEdit } from "@/entities/deck";

import { deckMutationLock, updateDeckDocument } from "@/entities/deck";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";

export const editDeck = async (uid: string, deck: DeckEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  await runSerially(deckMutationLock(uid, deck.id), () => waitForRemoteWrite(updateDeckDocument(deck), "Deck update"));
};
