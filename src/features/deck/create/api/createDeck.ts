import type { Deck } from "@/entities/deck";

import { resourceKey } from "@/shared/lib/resourceAccess";
import { runSerially } from "@/shared/lib/runSerially";
import { waitForRemoteWrite } from "@/shared/lib/remoteWrite";
import { createDeckDocument } from "./firestore";

const requireOwner = (uid: string, deck: Deck) => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
};

export const createDeck = async (uid: string, deck: Deck): Promise<void> => {
  requireOwner(uid, deck);
  await runSerially(resourceKey("deck", uid, deck.id), () =>
    waitForRemoteWrite(createDeckDocument(deck), "Deck creation")
  );
};
