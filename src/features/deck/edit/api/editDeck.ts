import type { DeckEdit } from "@/entities/deck";

import { updateDeckDocument } from "@/entities/deck";
import { runSerially } from "@/shared/lib/runSerially";
import { deckMutationLock } from "@/shared/lib/deckMutationLocks";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";

export const editDeck = async (uid: string, deck: DeckEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  await runSerially(deckMutationLock(uid, deck.id), () => waitForRemoteWrite(updateDeckDocument(deck), "Deck update"));
};
