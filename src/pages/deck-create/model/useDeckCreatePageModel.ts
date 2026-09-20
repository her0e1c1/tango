import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { useAuth } from "@/entities/auth";
import { CATEGORY, type DeckId } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const navigate = useNavigate();
  const { isAnonymous } = useAuth();
  const { form } = useDeckCreateFormState(isAnonymous);
  const pending = useStore(deckCreatePageStore, (state) => state.mutationId !== undefined);
  const isMounted = useMountedGuard();
  const guard = useNavigationGuard(form.formState.isDirty);
  useResetStoreOnMount(deckCreatePageStore);

  function openCreatedDeck(deckId: DeckId): void {
    const to = routes.cardList.to(deckId);
    void guard.allowNavigation({ historyAction: "REPLACE", to }, () => navigate(to, { replace: true }));
  }

  const onSubmit = form.handleSubmit(async (values) => {
    const deckId = await submitDeckCreation(values);
    // The Page may unmount between the action resolving and this continuation.
    if (deckId === undefined || !isMounted()) return;
    openCreatedDeck(deckId);
  });

  return {
    categories: CATEGORY,
    form,
    cloudStorageAvailable: !isAnonymous,
    pending,
    navigationGuard: guard.element,
    onCancel: () => void navigate(routes.deckList.to()),
    onSubmit,
  };
}
