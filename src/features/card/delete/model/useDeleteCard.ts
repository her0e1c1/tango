import { type Card, deleteCard } from "@/entities/card";

import { useAuthSession } from "@/entities/auth";

interface UseDeleteCardOptions {
  onSuccess?: (card: Card) => void;
}

export const useDeleteCard = ({ onSuccess }: UseDeleteCardOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";

  const remove = async (card: Card) => {
    await deleteCard(uid, card);
    onSuccess?.(card);
  };

  return { remove };
};
