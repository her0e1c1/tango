import type { Deck, DeckId } from "@/entities/deck";

import { useEffect, useRef } from "react";

import { useSession } from "@/entities/session";
import { useAsyncAction } from "@/shared/hooks";
import { deleteDeck } from "../api/deleteDeck";

interface UseDeckDeletionOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

export const useDeckDeletion = ({ onRemoveSuccess }: UseDeckDeletionOptions = {}) => {
  const auth = useSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const mutation = useAsyncAction<DeckId>(uid);
  const scope = useRef({ uid });
  const onRemoveSuccessRef = useRef(onRemoveSuccess);

  useEffect(() => {
    onRemoveSuccessRef.current = onRemoveSuccess;
  }, [onRemoveSuccess]);

  useEffect(() => {
    scope.current = { uid };
    return () => {
      scope.current = { uid };
    };
  }, [uid]);

  const remove = (deck: Deck) => {
    const operationScope = scope.current;
    return mutation.run([deck.id], `remove:${deck.id}`, async () => {
      if (uid === "") throw new Error("A confirmed user is required for Deck deletion");
      if (deck.uid !== uid) throw new Error("Deck owner does not match the authenticated user");
      await deleteDeck(deck.id);
      if (scope.current === operationScope) onRemoveSuccessRef.current?.(deck);
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
