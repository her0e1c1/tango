import { type DeckEdit, editDeck } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth";

export const useEditDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  return {
    update: (deck: DeckEdit) => editDeck(uid, deck),
  };
};
