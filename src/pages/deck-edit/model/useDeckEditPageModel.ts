import { useLayoutEffect } from "react";
import { useFormState } from "react-hook-form";
import { useStore } from "zustand";

import type { Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import type { DeckFormFields } from "@/features/deck-form";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { enterDeckEditPage } from "./actions/enterDeckEditPage";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckEdit } from "./actions/submitDeckEdit";
import { deckEditPageStore } from "./store";
import { useDeckEditFormState } from "./useDeckEditFormState";

export function useDeckEditPageModel(deck: Deck) {
  const { form } = useDeckEditFormState(deck);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const owner = useStore(deckEditPageStore, (state) => state.owner);
  const deletionTarget = useStore(deckEditPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckEditPageStore, (state) => state.deletionPending);
  // Clear the previous visit before its dialog can paint or accept input on the new route.
  useLayoutEffect(enterDeckEditPage, []);

  return {
    form,
    isDirty,
    isSubmitting,
    deletionTarget: getDeckDeletionTarget(deletionTarget),
    deletionPending,
    submit: (values: DeckFormFields, onSaved: () => void | Promise<void>) =>
      submitDeckEdit({
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
