/**
 * @file Provides Deck editor actions.
 * The hook combines mutation operations while its Page owner supplies navigation.
 */

import type { Deck } from "@/entities/deck";

import { useState } from "react";

interface DeckEditorActionsOptions {
  mutations: {
    update: (deck: Deck) => Promise<void>;
  };
  onCancel: () => void;
  onSaved: () => void;
}

/**
 * Provides the mutation actions used by the Deck editor.
 */
export const useDeckEditorActions = ({ mutations, onCancel, onSaved }: DeckEditorActionsOptions) => {
  const [error, setError] = useState<unknown>(null);

  return {
    save: async (deck: Deck) => {
      setError(null);
      try {
        await mutations.update(deck);
        onSaved();
      } catch (nextError) {
        setError(nextError);
      }
    },
    cancel: onCancel,
    error,
  };
};
