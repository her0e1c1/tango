import type { DeckEdit } from "@/entities/deck";

import { resourceKey } from "@/shared/lib/resourceAccess";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { updateDeckDocument } from "./firestore";

export const editDeck = async (uid: string, deck: DeckEdit): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  await runSerially(resourceKey("deck", uid, deck.id), () =>
    waitForRemoteWrite(updateDeckDocument(deck), "Deck update")
  );
};
