/** @file Provides Card mutation state and actions to React features. */

import { useAuth } from "@/auth/AuthContext";
import { useAsyncAction } from "@/hooks/useAsyncAction";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { runMutationLifecycle, type MutationLifecycle } from "@/hooks/mutationLifecycle";
import { cardCommands } from "@/services/cardCommands";

type CardPatch = Partial<Omit<Card, "id" | "deckId" | "uid">>;

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const { cardById } = useRemoteCollections();
  const mutation = useAsyncAction<CardId>(uid);

  const create = (card: Card) => mutation.run([card.id], `create:${card.id}`, () => cardCommands.create(uid, card));
  const update = <Context = unknown>(card: CardEdit, lifecycle?: MutationLifecycle<Context>) =>
    mutation.run([card.id], `update:${card.id}`, () =>
      runMutationLifecycle(() => cardCommands.update(uid, card), lifecycle)
    );
  const updateBy = (id: CardId, callback: (card: Card) => CardPatch) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return update({ ...callback(card), id: card.id, deckId: card.deckId });
  };
  const remove = (id: CardId) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return mutation.run([id], `remove:${id}`, () => cardCommands.remove(uid, id, card.deckId));
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
