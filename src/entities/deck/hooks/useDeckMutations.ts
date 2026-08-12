/** @file Provides Deck entity mutation state and actions. */

import type { Deck, DeckEdit, DeckId } from "../model/deck";

import { useEffect, useRef } from "react";

import { deckCommands } from "../api/commands";
import { useSession } from "@/entities/session";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";

interface UseDeckMutationsOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

export const useDeckMutations = ({ onRemoveSuccess }: UseDeckMutationsOptions = {}) => {
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

  const create = (deck: Deck) => mutation.run([deck.id], `create:${deck.id}`, () => deckCommands.create(uid, deck));
  const update = (deck: DeckEdit) => mutation.run([deck.id], `update:${deck.id}`, () => deckCommands.update(uid, deck));
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
    remove,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
