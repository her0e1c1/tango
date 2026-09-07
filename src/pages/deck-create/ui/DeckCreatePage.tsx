import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { DeckForm } from "@/features/deck-form";
import { CATEGORY } from "@/entities/deck";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreateFormState } from "../model/useDeckCreateFormState";
import { submitDeckCreation } from "../model/actions/submitDeckCreation";
import { getAuthUid } from "@/entities/auth";
import { dismissSaveError } from "../model/actions/dismissSaveError";

export const DeckCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const uid = getAuthUid();
  const state = useDeckCreateFormState();
  const onSubmit = (event?: React.BaseSyntheticEvent) =>
    submitDeckCreation(event, {
      uid,
      form: state.form,
      saveErrorToastId: state.saveErrorToastId,
      isMounted: state.isMounted,
      onCreated: (deckId) => {
        const cardListPath = routes.cardList.to(deckId);
        void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
          navigate(cardListPath, { replace: true })
        );
      },
    });
  const guard = useNavigationGuard(state.form.formState.isDirty);
  const cancel = () => {
    dismissSaveError(state.saveErrorToastId);
    void navigate(routes.deckList.to());
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <DeckForm
        mode="create"
        categories={CATEGORY}
        form={state.form}
        isLocalModeLocked={state.form.formState.isSubmitting}
        onCancel={cancel}
        onSubmit={onSubmit}
      />
    </AppLayout>
  );
};
