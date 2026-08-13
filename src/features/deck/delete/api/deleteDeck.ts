import type { Deck } from "@/entities/deck";

import { removeCardDocumentsForDeck } from "@/entities/card";
import { removeDeckDocument } from "@/entities/deck";
import { resourceKey, withResourceAccess } from "@/shared/lib/resourceAccess";
import { runSerially } from "@/shared/lib/runSerially";

export const deleteDeck = async (uid: string, deck: Deck): Promise<void> => {
  if (uid === "") throw new Error("A confirmed user is required for remote Deck writes");
  if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
  await runSerially(resourceKey("deck", uid, deck.id), () =>
    withResourceAccess([resourceKey("deck-membership", uid, deck.id)], "exclusive", async () => {
      await removeCardDocumentsForDeck(uid, deck.id);
      await removeDeckDocument(deck.id);
    })
  );
};
