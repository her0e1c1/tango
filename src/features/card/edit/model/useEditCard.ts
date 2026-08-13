import type { Card, CardEdit } from "@/entities/card";

import { useAuthSession } from "@/entities/auth-session";
import { editCard } from "../api/editCard";

type CardPatch = Omit<CardEdit, "id">;

export const useEditCard = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const update = (card: CardEdit) => editCard(uid, card);

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => CardPatch) => update({ ...buildPatch(card), id: card.id }),
  };
};
