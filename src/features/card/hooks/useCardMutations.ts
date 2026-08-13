/** @file Provides Card mutation state and actions to React features. */

import type { Card, CardEdit, CardId } from "@/entities/card";

import { useEffect, useRef } from "react";

import { useCards } from "@/entities/card";
import { useAuthSession } from "@/entities/auth-session";
import { useAsyncAction } from "@/shared/hooks";
import { cardCommands } from "../api/cardCommands";

type CardPatch = Partial<Omit<Card, "id" | "deckId" | "uid">>;

interface UseCardMutationsOptions {
  onRemoveSuccess?: (card: Card) => void;
}

export const useCardMutations = ({ onRemoveSuccess }: UseCardMutationsOptions = {}) => {
  const auth = useAuthSession();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const { cardsById } = useCards();
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
    const card = cardsById[id];
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return update({ ...callback(card), id: card.id, deckId: card.deckId });
  };
  const remove = (id: CardId) => {
    const card = cardsById[id];
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    const operationScope = scope.current;
    return mutation.run([id], `remove:${id}`, async () => {
      await cardCommands.remove(uid, id, card.deckId);
      if (scope.current === operationScope) onRemoveSuccessRef.current?.(card);
    });
  };
  return {
    create,
    update,
    updateBy,
    remove,
    pending: mutation.pending,
    isPending: mutation.isPending,
    error: mutation.error,
    retry: mutation.retry,
  };
};
