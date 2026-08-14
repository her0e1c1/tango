import type { Card } from "@/entities/card";

import { useAuthSession } from "@/entities/auth";

interface UseDeleteCardOptions {
  onSuccess?: (card: Card) => void;
}

type DeleteCard = (uid: string, card: Card) => Promise<void>;

export const useDeleteCard = ({ onSuccess }: UseDeleteCardOptions = {}, deleteCard?: DeleteCard) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  const remove = (card: Card) => {
    if (deleteCard == null) return Promise.reject(new Error("Card deletion is unavailable"));
    return deleteCard(uid, card).then(() => onSuccess?.(card));
  };

  return { remove };
};
