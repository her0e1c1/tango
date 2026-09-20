import { useFormState } from "react-hook-form";
import { useStore } from "zustand";

import type { Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import type { DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckEdit } from "./actions/submitDeckEdit";
import { deckEditPageStore } from "./store";
import { useDeckEditFormState } from "./useDeckEditFormState";

export function useDeckEditPageModel(deck: Deck) {
  const { form } = useDeckEditFormState(deck);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const isMounted = useMountedGuard();
  const deletionTarget = useStore(deckEditPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckEditPageStore, (state) => state.deletionPending);
  useResetStoreOnMount(deckEditPageStore);

  return {
    form,
    isDirty,
    isSubmitting,
    deletionTarget: getDeckDeletionTarget(deletionTarget),
    deletionPending,
    submit: (values: DeckFormFields, onSaved: () => void | Promise<void>) =>
      submitDeckEdit({
        isMounted,
        deckId: deck.id,
        values,
        onSaved,
      }),
    requestDeletion: () => requestDeletion(deck.id),
    cancelDeletion,
    confirmDeletion: (onDeleted: () => void | Promise<void>) => confirmDeletion(isMounted, onDeleted),
  };
}
