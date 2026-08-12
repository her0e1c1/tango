/**
 * @file Provides Deck editor actions.
 * The hook combines mutation state and operations while its Page owner supplies navigation.
 */

import type { Deck } from "@/entities/deck";

import { useDeckMutations } from "@/entities/deck";

interface DeckEditorActionsOptions {
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Provides the mutation actions used by the Deck editor.
 */
export const useDeckEditorActions = ({ onCancel, onSaved }: DeckEditorActionsOptions) => {
  const mutations = useDeckMutations();
  return {
    save: async (deck: Deck) => {
      try {
        await mutations.update(deck);
        onSaved();
      } catch {
        // The mutation notice owns error feedback and retry.
      }
    },
    cancel: onCancel,
    pending: mutations.pending,
    error: mutations.error,
    retry: mutations.retry,
  };
};
