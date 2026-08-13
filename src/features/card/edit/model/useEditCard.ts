import type { Card, CardEdit, CardId } from "@/entities/card";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { editCard } from "../api/editCard";

type CardPatch = Omit<CardEdit, "id">;

export const useEditCard = () => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<CardId>(uid);
  const update = (card: CardEdit) => mutation.run([card.id], `update:${card.id}`, () => editCard(uid, card));

  return {
    update,
    updateBy: (card: Card, buildPatch: (card: Card) => CardPatch) => update({ ...buildPatch(card), id: card.id }),
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
