import type { Deck } from "@/entities/deck";

import { deckMembershipMutationLock, deckMutationLock, withDeckMembershipLocks } from "@/entities/deck";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { removeDeckWithCards } from "../api/removeDeck";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
};

const requireOwner = (uid: string, entityUid: string) => {
  if (entityUid !== uid) throw new Error("Deck owner does not match the authenticated user");
};

export const removeDeck = async (uid: string, deck: Deck): Promise<void> => {
  requireUid(uid);
  requireOwner(uid, deck.uid);
  await runSerially(deckMutationLock(uid, deck.id), () =>
    withDeckMembershipLocks([deckMembershipMutationLock(uid, deck.id)], "exclusive", () =>
      waitForRemoteWrite(removeDeckWithCards(deck.id, uid), "Deck deletion")
    )
  );
};
