import type { Deck } from "@/entities/deck";

import { useEffect, useRef } from "react";

import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { deleteDeck } from "../api/deleteDeck";

interface UseDeleteDeckOptions {
  onSuccess?: (deck: Deck) => void;
}

export const useDeleteDeck = ({ onSuccess }: UseDeleteDeckOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<string>(uid);
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

  const remove = (deck: Deck) => {
    const operationScope = scope.current;
    return mutation.run([deck.id], `remove:${deck.id}`, async () => {
      await deleteDeck(uid, deck);
      if (scope.current === operationScope) onSuccessRef.current?.(deck);
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
