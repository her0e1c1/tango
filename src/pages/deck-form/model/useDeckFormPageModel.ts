import { useLayoutEffect } from "react";
import { useFormState } from "react-hook-form";
import { useStore } from "zustand";

import type { Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import type { DeckFormFields } from "@/features/deck-form";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { enterDeckFormPage } from "./actions/enterDeckFormPage";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckForm } from "./actions/submitDeckForm";
import { deckFormPageStore } from "./store";
import { useDeckFormState } from "./useDeckFormState";

export function useDeckFormPageModel(deck: Deck) {
  const { form } = useDeckFormState(deck);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const owner = useStore(deckFormPageStore, (state) => state.owner);
  const deletionTarget = useStore(deckFormPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckFormPageStore, (state) => state.deletionPending);
  // Clear the previous visit before its dialog can paint or accept input on the new route.
  useLayoutEffect(enterDeckFormPage, []);

  return {
    form,
    isDirty,
    isSubmitting,
    deletionTarget: getDeckDeletionTarget(deletionTarget),
    deletionPending,
    submit: (values: DeckFormFields, onSaved: () => void | Promise<void>) =>
      submitDeckForm({
        owner,
        deckId: deck.id,
        values,
        onSaved,
      }),
    requestDeletion: () => requestDeletion(deck.id),
    cancelDeletion,
    confirmDeletion,
  };
}
