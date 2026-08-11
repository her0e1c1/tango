/** @file Provides Deck mutation state and actions to React features. */

import { useEffect, useRef } from "react";

import { useAuth } from "@/auth/AuthContext";
import type { DeckFilterPatch } from "@/entities/deck";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { deckCommands } from "@/services/deckCommands";

interface UseDeckMutationsOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

export const useDeckMutations = ({ onRemoveSuccess }: UseDeckMutationsOptions = {}) => {
  const auth = useAuth();
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

  const create = (deck: Deck) => mutation.run([deck.id], `create:${deck.id}`, () => deckCommands.create(uid, deck));
  const update = (deck: DeckEdit) => mutation.run([deck.id], `update:${deck.id}`, () => deckCommands.update(uid, deck));
  const updateFilter = (deckId: DeckId, patch: DeckFilterPatch) =>
    mutation.run([deckId], `updateFilter:${deckId}`, () => deckCommands.updateFilter(uid, deckId, patch));
  const remove = (deck: Deck) => {
    const operationScope = scope.current;
    return mutation.run([deck.id], `remove:${deck.id}`, async () => {
      await deckCommands.remove(uid, deck);
      if (scope.current === operationScope) onRemoveSuccessRef.current?.(deck);
    });
  };

  return {
    create,
    update,
    updateFilter,
    remove,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
