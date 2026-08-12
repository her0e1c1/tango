/**
 * @file Provides navigation-aware Deck editor actions.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import type { Deck } from "@/entities/deck";

import { useNavigate } from "react-router-dom";

import { useDeckMutations } from "@/entities/deck";

/**
 * Provides the mutation and navigation actions used by the Deck editor.
 */
export const useDeckEditorActions = () => {
  const navigate = useNavigate();
  const mutations = useDeckMutations();
  return {
    updateAndGoToList: async (deck: Deck) => {
      try {
        await mutations.update(deck);
        void navigate("/", { replace: true });
      } catch {
        // The mutation notice owns error feedback and retry.
      }
    },
    goToList: () => void navigate("/", { replace: true }),
    pending: mutations.pending,
    error: mutations.error,
    retry: mutations.retry,
  };
};
