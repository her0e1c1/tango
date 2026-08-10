/**
 * @file Provides the deck feature's Use Deck Actions React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */
import type { Deck } from "@/entities/deck";

import { useNavigate } from "react-router-dom";

import { useDeckMutations } from "@/features/deck/hooks/useDeckMutations";

/**
 * Provides the deck actions values and operations needed by React components.
 * Callers receive one focused interface without coordinating the deck feature's stores and
 * services themselves.
 */
export const useDeckActions = (deck: Deck | undefined) => {
  const navigate = useNavigate();
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
    remove: () => (deck == null ? Promise.reject(new Error("Deck is not available")) : mutations.remove(deck)),
    pending: mutations.pending,
    error: mutations.error,
    retry: mutations.retry,
  };
};
