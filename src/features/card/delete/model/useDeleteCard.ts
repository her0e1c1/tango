import type { Card } from "@/entities/card";

import { useAuthSession } from "@/entities/auth-session";
import { deleteCard } from "../api/deleteCard";

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
