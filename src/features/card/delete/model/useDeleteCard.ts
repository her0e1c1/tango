import type { Card, CardId } from "@/entities/card";

import { useEffect, useRef } from "react";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { deleteCard } from "../api/deleteCard";

interface UseDeleteCardOptions {
  onSuccess?: (card: Card) => void;
}

export const useDeleteCard = ({ onSuccess }: UseDeleteCardOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<CardId>(uid);
  const scope = useRef({ uid });
  const onSuccessRef = useRef(onSuccess);

  useEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);
  useEffect(() => {
    scope.current = { uid };
    return () => {
      scope.current = { uid };
    };
  }, [uid]);

  const remove = (card: Card) => {
    const operationScope = scope.current;
    return mutation.run([card.id], `remove:${card.id}`, async () => {
      await deleteCard(uid, card);
      if (scope.current === operationScope) onSuccessRef.current?.(card);
    });
  };

  return {
    remove,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
