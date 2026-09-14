import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { DeckForm } from "@/features/deck-form";
import { CATEGORY } from "@/entities/deck";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreatePageModel } from "../model/useDeckCreatePageModel";

export const DeckCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const model = useDeckCreatePageModel();
  const guard = useNavigationGuard(model.form.formState.isDirty);
  const onSubmit = model.form.handleSubmit(async (values) => {
    const deckId = await model.submit(values);
    // The Page may unmount between the action resolving and this continuation.
    if (deckId === undefined || !model.isMounted()) return;
    const cardListPath = routes.cardList.to(deckId);
    void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
      navigate(cardListPath, { replace: true })
    );
  });
  const cancel = () => {
    model.dismissSaveError();
    void navigate(routes.deckList.to());
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <DeckForm
        mode="create"
        categories={CATEGORY}
        form={model.form}
        isLocalModeLocked={model.pending}
        onCancel={cancel}
        onSubmit={(event) => void onSubmit(event)}
      />
    </AppLayout>
  );
};
