import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";
import { CATEGORY, type Deck } from "@/entities/deck";
import { getDeckDeletionTarget } from "@/features/deck-deletion";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import { cancelDeletion } from "./actions/cancelDeletion";
import { confirmDeletion } from "./actions/confirmDeletion";
import { requestDeletion } from "./actions/requestDeletion";
import { submitDeckEdit } from "./actions/submitDeckEdit";
import { deckEditPageStore } from "./store";
import { useDeckEditFormState } from "./useDeckEditFormState";
import { useOpeningDeck } from "./useOpeningDeck";

export function useDeckEditRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const openingDeck = useOpeningDeck(deckId);
  return { deckId, openingDeck };
}

export function useDeckEditPageModel(deck: Deck) {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { form } = useDeckEditFormState(deck);
  const { isDirty, isSubmitting } = form.formState;
  const isMounted = useMountedGuard();
  const deletionTarget = useStore(deckEditPageStore, (state) => state.deletionTarget);
  const deletionPending = useStore(deckEditPageStore, (state) => state.deletionId !== undefined);
  const guard = useNavigationGuard(isDirty || isSubmitting);
  useResetStoreOnMount(deckEditPageStore);

  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const onCompleted = () => guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  const onSubmit = form.handleSubmit(async (values) => {
    // Validation can finish after the originating form was replaced.
    if (!isMounted()) return;
    const saved = await submitDeckEdit(deck.id, values);
    // The Page may unmount between the action resolving and this continuation.
    if (!saved || !isMounted()) return;
    await onCompleted();
  });

  return {
    form,
    categories: CATEGORY,
    cloudStorageAvailable: !isAnonymous,
    isSubmitting,
    navigationGuard: guard.element,
    deletionTarget: guard.isBlocked ? undefined : getDeckDeletionTarget(deletionTarget),
    deletionPending,
    onCancel: () => void goToList(),
    onSubmit,
    requestDeletion: () => requestDeletion(deck.id),
    cancelDeletion,
    confirmDeletion: async () => {
      if (!isMounted()) return;
      const deleted = await confirmDeletion();
      if (deleted && isMounted()) await onCompleted();
    },
  };
}
