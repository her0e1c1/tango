/** @file Provides Card mutation state and actions to React features. */

import { useAuth } from "@/auth/AuthContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { cardCommands } from "@/services/cardCommands";

type CardPatch = Partial<Omit<Card, "id" | "deckId" | "uid">>;

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const { cardById } = useRemoteCollections();
  const mutation = useAsyncAction<CardId>(uid);

  const create = (card: Card) => mutation.run([card.id], () => cardCommands.create(uid, card));
  const update = (card: CardEdit) => mutation.run([card.id], () => cardCommands.update(uid, card));
  const updateBy = (id: CardId, callback: (card: Card) => CardPatch) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return update({ ...callback(card), id: card.id, deckId: card.deckId });
  };
  const remove = (id: CardId) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return mutation.run([id], () => cardCommands.remove(uid, id));
  };
  const bulkUpsert = (cards: Card[]) =>
    mutation.run(
      cards.map((card) => card.id),
      () => cardCommands.bulkUpsert(uid, cards)
    );

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
