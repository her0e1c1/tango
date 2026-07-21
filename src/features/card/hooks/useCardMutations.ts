/** @file Provides Card mutation state and actions to React features. */

import { useStore } from "zustand";

import { useAuth } from "@/auth/AuthContext";
import { useRemoteCollections } from "@/hooks/useRemoteCollections";
import { remoteStore } from "@/store/remoteStore";

const noPendingCards = new Map<CardId, number>();

export const useCardMutations = () => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const { cardById } = useRemoteCollections();
  const mutation = useStore(remoteStore, (state) => state.cardMutation);
  const createCard = useStore(remoteStore, (state) => state.createCard);
  const updateCard = useStore(remoteStore, (state) => state.updateCard);
  const removeCard = useStore(remoteStore, (state) => state.removeCard);
  const bulkUpsertCards = useStore(remoteStore, (state) => state.bulkUpsertCards);
  const retryCardMutation = useStore(remoteStore, (state) => state.retryCardMutation);
  const pendingCounts = mutation.uid === uid ? mutation.pendingCounts : noPendingCards;

  const create = (card: Card) => createCard(uid, card);
  const update = (card: CardEdit) => updateCard(uid, card);
  const updateBy = (id: CardId, callback: (card: Card) => Partial<Card>) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return updateCard(uid, { ...card, ...callback(card) });
  };
  const remove = (id: CardId) => {
    const card = cardById(id);
    if (card == null) return Promise.reject(new Error(`Card ${id} is not available`));
    return removeCard(uid, id, card.deckId);
  };
  const bulkUpsert = (cards: Card[]) => bulkUpsertCards(uid, cards);
  const isPending = (id: CardId) => pendingCounts.has(id);
  const retry = () => {
    void retryCardMutation(uid).catch(() => undefined);
  };

  return {
    create,
    update,
    updateBy,
    remove,
    bulkUpsert,
    isPending,
    pending: pendingCounts.size > 0,
    error: mutation.uid === uid ? mutation.error : null,
    retry,
  };
};
