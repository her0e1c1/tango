import type { Deck, DeckId } from "@/entities/deck";

import { useEffect, useRef } from "react";

import { useSession } from "@/entities/session";
import { useAsyncAction } from "@/shared/hooks";
import { removeDeck } from "../model/removeDeck";

interface UseDeckRemovalOptions {
  onSuccess?: (deck: Deck) => void;
}

export const useDeckRemoval = ({ onSuccess }: UseDeckRemovalOptions = {}) => {
  const auth = useSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<DeckId>(uid);
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
      await removeDeck(uid, deck);
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
