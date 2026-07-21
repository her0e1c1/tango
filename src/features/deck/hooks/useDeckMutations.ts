/** @file Provides Deck mutation state and actions to React features. */

import { useEffect, useRef } from "react";
import { useStore } from "zustand";

import { useAuth } from "@/auth/AuthContext";
import { remoteStore } from "@/store/remoteStore";

interface UseDeckMutationsOptions {
  onRemoveSuccess?: (deck: Deck) => void;
}

const noPendingDecks = new Map<DeckId, number>();

export const useDeckMutations = ({ onRemoveSuccess }: UseDeckMutationsOptions = {}) => {
  const auth = useAuth();
  const uid = auth.status === "authenticated" ? auth.uid : "";
  const currentUid = useRef(uid);
  const onRemoveSuccessRef = useRef(onRemoveSuccess);
  useEffect(() => {
    currentUid.current = uid;
    onRemoveSuccessRef.current = onRemoveSuccess;
  }, [onRemoveSuccess, uid]);

  const mutation = useStore(remoteStore, (state) => state.deckMutation);
  const createDeck = useStore(remoteStore, (state) => state.createDeck);
  const updateDeck = useStore(remoteStore, (state) => state.updateDeck);
  const removeDeck = useStore(remoteStore, (state) => state.removeDeck);
  const retryDeckMutation = useStore(remoteStore, (state) => state.retryDeckMutation);
  const pendingCounts = mutation.uid === uid ? mutation.pendingCounts : noPendingDecks;

  const create = (deck: Deck) => createDeck(uid, deck);
  const update = (deck: DeckEdit) => updateDeck(uid, deck);
  const remove = async (deck: Deck) => {
    const started = await removeDeck(uid, deck);
    if (started && currentUid.current === uid) onRemoveSuccessRef.current?.(deck);
  };
  const isPending = (id: DeckId) => pendingCounts.has(id);
  const retry = () => {
    void retryDeckMutation(uid)
      .then((deck) => {
        if (deck != null && currentUid.current === uid) onRemoveSuccessRef.current?.(deck);
      })
      .catch(() => undefined);
  };

  return {
    create,
    update,
    remove,
    pending: pendingCounts.size > 0,
    isPending,
    error: mutation.uid === uid ? mutation.error : null,
    retry,
  };
};
