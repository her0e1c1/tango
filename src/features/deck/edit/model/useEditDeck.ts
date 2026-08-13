import type { DeckEdit } from "@/entities/deck";

import { useAuthSession } from "@/entities/auth-session";
import { editDeck } from "../api/editDeck";

export const useEditDeck = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  return {
    update: (deck: DeckEdit) => editDeck(uid, deck),
  };
};
