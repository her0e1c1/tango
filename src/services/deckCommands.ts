import {
  create as createRemoteDeck,
  remove as removeRemoteDeck,
  update as updateRemoteDeck,
  updateFilter as updateRemoteDeckFilter,
} from "@/adapters/firestore/deck";
import type { DeckFilterPatch } from "@/domain/deckFilter";
import {
  deckMembershipMutationLock,
  deckMutationLock,
  withDeckMembershipLocks,
  withMutationLocks,
} from "@/store/remoteMutationLocks";

const requireUid = (uid: string) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
};

const requireOwner = (uid: string, entityUid: string | undefined) => {
  if (entityUid != null && entityUid !== uid) {
    throw new Error("Deck owner does not match the authenticated user");
  }
};

export const deckCommands = {
  create: async (uid: string, deck: Deck): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, deck.uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () => createRemoteDeck(deck));
  },

  update: async (uid: string, deck: DeckEdit): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, deck.uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () => updateRemoteDeck(deck));
  },

  updateFilter: async (uid: string, deckId: DeckId, patch: DeckFilterPatch): Promise<void> => {
    requireUid(uid);
    await withMutationLocks([deckMutationLock(uid, deckId)], () => updateRemoteDeckFilter(deckId, patch));
  },

  remove: async (uid: string, deck: Deck): Promise<void> => {
    requireUid(uid);
    requireOwner(uid, deck.uid);
    await withMutationLocks([deckMutationLock(uid, deck.id)], () =>
      withDeckMembershipLocks([deckMembershipMutationLock(uid, deck.id)], "exclusive", () => removeRemoteDeck(deck.id))
    );
  },
};
