import type { Deck } from "@/entities/deck";

import { deckMembershipMutationLock, deckMutationLock, withDeckMembershipLocks } from "@/entities/deck";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { removeDeckWithCards } from "../api/removeDeck";

const activeRemovals = new Map<string, Promise<void>>();

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
};

const requireOwner = (uid: string, entityUid: string) => {
  if (entityUid !== uid) throw new Error("Deck owner does not match the authenticated user");
};

const getOrStartRemoval = (uid: string, deckId: string): Promise<void> => {
  const key = deckMutationLock(uid, deckId);
  const active = activeRemovals.get(key);
  if (active != null) return active;

  const operation = runSerially(key, () =>
    withDeckMembershipLocks([deckMembershipMutationLock(uid, deckId)], "exclusive", () =>
      removeDeckWithCards(deckId, uid)
    )
  );
  activeRemovals.set(key, operation);
  const clear = () => {
    if (activeRemovals.get(key) === operation) activeRemovals.delete(key);
  };
  void operation.then(clear, clear);
  return operation;
};

export const removeDeck = async (uid: string, deck: Deck): Promise<void> => {
  requireUid(uid);
  requireOwner(uid, deck.uid);
  await waitForRemoteWrite(getOrStartRemoval(uid, deck.id), "Deck deletion");
};
