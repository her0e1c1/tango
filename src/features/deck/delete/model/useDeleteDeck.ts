import { type Deck, deleteDeck } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth";

export const useDeleteDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  return {
    remove: (deck: Deck) => deleteDeck(uid, deck),
  };
};
