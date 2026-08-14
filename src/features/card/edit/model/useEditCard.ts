import type { Card, CardEdit } from "@/entities/card";

import { useAuthSession } from "@/entities/auth";

type CardPatch = Omit<CardEdit, "id" | "uid">;

type EditCard = (uid: string, card: CardEdit) => Promise<void>;

export const useEditCard = (editCard?: EditCard) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const update = (card: CardEdit) =>
    editCard == null ? Promise.reject(new Error("Card editing is unavailable")) : editCard(uid, card);

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => CardPatch) =>
      update({ ...buildPatch(card), id: card.id, uid: card.uid }),
  };
};
