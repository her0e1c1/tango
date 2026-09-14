import { type SubmitEvent, useLayoutEffect } from "react";
import { useFormState } from "react-hook-form";
import { useStore } from "zustand";

import type { Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";

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
    onSubmit: (event: SubmitEvent<HTMLFormElement>, onSaved: () => void | Promise<void>) =>
      submitDeckForm(event, {
        deckId: deck.id,
        localMode: deck.localMode,
        handleSubmit: form.handleSubmit,
        onSaved,
      }),
    requestDeletion: () => requestDeletion(deck.id),
    cancelDeletion,
    confirmDeletion,
  };
}
