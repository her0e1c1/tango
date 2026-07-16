import * as React from "react";
import { useNavigate } from "react-router-dom";

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { useRemoteCollections } from "@/query/useRemoteCollections";

export const useDeckActions = (id: DeckId) => {
  const navigate = useNavigate();
  const remote = useRemoteCollections();
  const mutations = useDeckMutations();
  return React.useMemo(
    () => ({
      update: mutations.update,
      updateAndBack: async (deck: Deck) => {
        try {
          await mutations.update(deck);
          void navigate(-1);
        } catch {
          // The mutation notice owns error feedback and retry.
        }
      },
      remove: () => {
        const deck = remote.deckById(id);
        return deck == null ? Promise.reject(new Error(`Deck ${id} is not available`)) : mutations.remove(deck);
      },
      pending: mutations.pending,
      error: mutations.error,
      retry: mutations.retry,
    }),
    [id, mutations, navigate, remote]
  );
};
