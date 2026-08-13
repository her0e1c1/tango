import type { Deck } from "@/entities/deck";

import { removeCardDocumentsForDeck } from "@/entities/card";
import { removeDeckDocument } from "@/entities/deck";
import { runSerially } from "@/shared/lib/runSerially";
import { deckMembershipMutationLock, deckMutationLock, withDeckMembershipLocks } from "@/shared/lib/deckMutationLocks";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";

export const deleteDeck = async (uid: string, deck: Deck): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
  await runSerially(deckMutationLock(uid, deck.id), () =>
    withDeckMembershipLocks([deckMembershipMutationLock(uid, deck.id)], "exclusive", async () => {
      await waitForRemoteWrite(removeCardDocumentsForDeck(uid, deck.id), "Deck card deletion");
      await waitForRemoteWrite(removeDeckDocument(deck.id), "Deck deletion");
    })
  );
};
