import type { Deck } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth";

type DeleteDeck = (uid: string, deck: Deck) => Promise<void>;

export const useDeleteDeck = (deleteDeck?: DeleteDeck) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  return {
    remove: (deck: Deck) =>
      deleteDeck == null ? Promise.reject(new Error("Deck deletion is unavailable")) : deleteDeck(uid, deck),
  };
};
