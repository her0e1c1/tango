import { useNavigate } from "react-router-dom";

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";
import { useRemoteCollections } from "@/query/useRemoteCollections";

export const useDeckActions = (id: DeckId) => {
  const navigate = useNavigate();
  const remote = useRemoteCollections();
  const mutations = useDeckMutations();
  return {
    update: mutations.update,
    updateAndGoToList: async (deck: Deck) => {
      try {
        await mutations.update(deck);
        void navigate("/", { replace: true });
      } catch {
        // The mutation notice owns error feedback and retry.
      }
    },
    goToList: () => void navigate("/", { replace: true }),
    remove: () => {
      const deck = remote.deckById(id);
      return deck == null ? Promise.reject(new Error(`Deck ${id} is not available`)) : mutations.remove(deck);
    },
    pending: mutations.pending,
    error: mutations.error,
    retry: mutations.retry,
  };
};
