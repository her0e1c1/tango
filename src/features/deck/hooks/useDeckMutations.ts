/** @file Provides Deck mutation state and actions to React features. */

import { useEffect, useRef } from "react";

import { useAuth } from "@/auth/AuthContext";
import type { DeckFilterPatch } from "@/domain/deckFilter";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { runMutationLifecycle, type MutationLifecycle } from "@/hooks/mutationLifecycle";
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
  const update = <Context = unknown>(deck: DeckEdit, lifecycle?: MutationLifecycle<Context>) =>
    mutation.run([deck.id], `update:${deck.id}`, () =>
      runMutationLifecycle(() => deckCommands.update(uid, deck), lifecycle)
    );
  const updateFilter = <Context = unknown>(
    deckId: DeckId,
    patch: DeckFilterPatch,
    lifecycle?: MutationLifecycle<Context>
  ) =>
    mutation.run([deckId], `updateFilter:${deckId}`, () =>
      runMutationLifecycle(() => deckCommands.updateFilter(uid, deckId, patch), lifecycle)
    );
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
