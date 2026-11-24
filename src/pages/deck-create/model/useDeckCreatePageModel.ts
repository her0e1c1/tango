import type { SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { CATEGORY } from "@/entities/deck";
import { useMountedAbortSignal } from "@/shared/lib/useMountedAbortSignal";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import type { DeckFormFields } from "@/features/deck-form";
import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const navigate = useNavigate();
  const { form } = useDeckCreateFormState();
  const pending = useStore(deckCreatePageStore, (state) => state.mutationId !== undefined);
  const getSignal = useMountedAbortSignal();
  const guard = useNavigationGuard(form.formState.isDirty || pending);
  useResetStoreOnMount(deckCreatePageStore);

  const submit = async (values: DeckFormFields) => {
    const signal = getSignal();
    if (signal === undefined) return;
    const deckId = await submitDeckCreation(values, signal);
    if (deckId === undefined || signal.aborted) return;
    const to = routes.cardList.to(deckId);
    await guard.allowNavigation({ historyAction: "REPLACE", to }, () => navigate(to, { replace: true }));
  };
  const onSubmit = (event: SubmitEvent<HTMLFormElement>) => form.handleSubmit(submit)(event);

  return {
    categories: CATEGORY,
    form,
    pending,
    navigationGuard: guard.element,
    onCancel: () => void navigate(routes.deckList.to()),
    onSubmit,
  };
}
