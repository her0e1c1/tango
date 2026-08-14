import type { Deck } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth";
import { deleteDeck } from "../api/deleteDeck";

export const useDeleteDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  return {
    remove: (deck: Deck) => deleteDeck(uid, deck),
  };
};
