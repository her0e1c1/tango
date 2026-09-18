import { useNavigate } from "react-router-dom";
import { useStore } from "zustand";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";
import { routes, useNavigationGuard } from "@/shared/router";

import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const navigate = useNavigate();
  const { form } = useDeckCreateFormState();
  const pending = useStore(deckCreatePageStore, (state) => state.mutationId !== undefined);
  const isMounted = useMountedGuard();
  const guard = useNavigationGuard(form.formState.isDirty);
  useResetStoreOnMount(deckCreatePageStore);

  const onSubmit = form.handleSubmit((values) =>
    submitDeckCreation(values, isMounted, (deckId) => {
      const cardListPath = routes.cardList.to(deckId);
      void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
        navigate(cardListPath, { replace: true })
      );
    })
  );

  return {
    form,
    pending,
    navigationGuard: guard.element,
    onCancel: () => void navigate(routes.deckList.to()),
    onSubmit,
  };
}
