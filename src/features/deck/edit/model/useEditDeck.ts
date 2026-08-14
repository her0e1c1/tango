import type { DeckEdit } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth";

type EditDeck = (uid: string, deck: DeckEdit) => Promise<void>;

export const useEditDeck = (editDeck?: EditDeck) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  return {
    update: (deck: DeckEdit) =>
      editDeck == null ? Promise.reject(new Error("Deck editing is unavailable")) : editDeck(uid, deck),
  };
};
