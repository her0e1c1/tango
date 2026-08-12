import type { Deck, DeckEdit } from "../model/deck";

import {
  deckMembershipMutationLock,
  deckMutationLock,
  withDeckMembershipLocks,
  withMutationLocks,
} from "@/store/remoteMutationLocks";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { create as createRemoteDeck, remove as removeRemoteDeck, update as updateRemoteDeck } from "./firestore";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
};

const requireOwner = (uid: string, entityUid: string) => {
  if (entityUid !== uid) {
    throw new Error("Deck owner does not match the authenticated user");
  }
};

export const deckCommands = {
  create: async (uid: string, deck: Deck): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, deck.uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () =>
      waitForRemoteWrite(createRemoteDeck(deck), "Deck creation")
    );
  },

  update: async (uid: string, deck: DeckEdit): Promise<void> => {
    requireUid(uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () =>
      waitForRemoteWrite(updateRemoteDeck(deck), "Deck update")
    );
  },

  remove: async (uid: string, deck: Deck): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, deck.uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () =>
      withDeckMembershipLocks([deckMembershipMutationLock(uid, deck.id)], "exclusive", () =>
        waitForRemoteWrite(removeRemoteDeck(deck.id, uid), "Deck deletion")
      )
    );
  },
};
