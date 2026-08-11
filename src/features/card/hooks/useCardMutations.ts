/** @file Provides Card mutation state and actions to React features. */

import type { Card, CardEdit, CardId } from "@/entities/card";

import { useEffect, useRef } from "react";

import { useAuth } from "@/auth/AuthContext";
import { useAsyncAction } from "@/shared/hooks/useAsyncAction";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { cardCommands } from "@/services/cardCommands";

type CardPatch = Partial<Omit<Card, "id" | "deckId" | "uid">>;

interface UseCardMutationsOptions {
  onRemoveSuccess?: (card: Card) => void;
}

export const useCardMutations = ({ onRemoveSuccess }: UseCardMutationsOptions = {}) => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const { cardById } = useRemoteCollections();
  const mutation = useAsyncAction<CardId>(uid);
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

  const create = (card: Card) => mutation.run([card.id], `create:${card.id}`, () => cardCommands.create(uid, card));
  const update = (card: CardEdit) => mutation.run([card.id], `update:${card.id}`, () => cardCommands.update(uid, card));
  const updateBy = (id: CardId, callback: (card: Card) => CardPatch) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return update({ ...callback(card), id: card.id, deckId: card.deckId });
  };
  const remove = (id: CardId) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    const operationScope = scope.current;
    return mutation.run([id], `remove:${id}`, async () => {
      await cardCommands.remove(uid, id, card.deckId);
      if (scope.current === operationScope) onRemoveSuccessRef.current?.(card);
    });
  };
  const bulkUpsert = (cards: Card[]) => {
    const ids = cards.map((card) => card.id);
    return mutation.run(ids, `bulkUpsert:${JSON.stringify([...ids].sort())}`, () =>
      cardCommands.bulkUpsert(uid, cards)
    );
  };

  return {
    create,
    update,
    updateBy,
    remove,
    bulkUpsert,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
