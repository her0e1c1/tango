import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { CATEGORY, type DeckId, useDeck } from "@/entities/deck";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";
import { showToast } from "@/shared/ui/toast";

import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const navigate = useNavigate();
  const { form } = useDeckCreateFormState();
  const pending = useStore(deckCreatePageStore, (state) => state.mutationId !== undefined);
  const [target, setTarget] = useState<{ deckId: DeckId; name: string; mutationId: symbol }>();
  const createdDeck = useDeck(target?.deckId);
  const isMounted = useMountedGuard();
  const guard = useNavigationGuard(form.formState.isDirty || pending);
  useResetStoreOnMount(deckCreatePageStore);

  const onSubmit = form.handleSubmit(async (values) => {
    const submitted = await submitDeckCreation(values);
    if (submitted !== undefined && isMounted()) setTarget(submitted);
  });
  useEffect(() => {
    if (target === undefined || createdDeck === undefined) return;
    if (deckCreatePageStore.getState().mutationId !== target.mutationId) return;
    deckCreatePageStore.setState({ mutationId: undefined });
    showToast({ messageKey: "deckForm.toast.created", messageParams: { name: target.name }, tone: "success" });
    const to = routes.cardList.to(target.deckId);
    void guard.allowNavigation({ historyAction: "REPLACE", to }, () => navigate(to, { replace: true }));
  }, [createdDeck, guard, navigate, target]);

  return {
    categories: CATEGORY,
    form,
    pending,
    navigationGuard: guard.element,
    onCancel: () => void navigate(routes.deckList.to()),
    onSubmit,
  };
}
