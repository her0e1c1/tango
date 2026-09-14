import type { SubmitEvent } from "react";
import { useFormState } from "react-hook-form";
import { useStore } from "zustand";

import { useCards } from "@/entities/card";
import { type Deck, useDecks } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckForm } from "./actions/submitDeckForm";
import { useDeckFormState } from "./useDeckFormState";

export function useDeckFormPageModel(deck: Deck) {
  const { form, store } = useDeckFormState(deck);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const deletionTarget = useStore(store, (state) => state.deletionTarget);
  const deletionPending = useStore(store, (state) => state.deletionPending);
  const decks = useDecks();
  const cards = useCards();
  const isMounted = useMountedGuard();

  return {
    form,
    isDirty,
    isSubmitting,
    deletionTarget: getDeckDeletionTarget(deletionTarget),
    deletionPending,
    onSubmit: (event: SubmitEvent<HTMLFormElement>, onSaved: () => void | Promise<void>) =>
      submitDeckForm(event, {
        deckId: deck.id,
        localMode: deck.localMode,
        handleSubmit: form.handleSubmit,
        store,
        isMounted,
        onSaved,
      }),
    requestDeletion: () => requestDeletion({ deckId: deck.id, decks, cards, store }),
    cancelDeletion: () => cancelDeletion(store),
    confirmDeletion: (onDeleted: () => void | Promise<void>) => confirmDeletion({ store, isMounted, onDeleted }),
  };
}
