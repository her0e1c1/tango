import type * as React from "react";
import { useNavigate } from "react-router-dom";

import type { Card } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useCardFormPageModel } from "../model/useCardFormPageModel";
import { CardEditor } from "./CardEditor";

export const CardFormContainer: React.FC<{ card: Card }> = ({ card }) => {
  const navigate = useNavigate();
  const { cardInfo, form, isSaving, submitForm, dismissSaveError } = useCardFormPageModel(card);
  const guard = useNavigationGuard(form.formState.isDirty || isSaving);

  const onSaved = (deckId: Card["deckId"]) => {
    const cardListPath = routes.cardList.to(deckId);
    void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
      navigate(cardListPath, { replace: true })
    );
  };

  const cancel = () => {
    dismissSaveError();
    void navigate(-1);
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <CardEditor
        cardInfo={cardInfo}
        categories={CATEGORY}
        form={form}
        isSaving={isSaving}
        onCancel={cancel}
        onSubmit={(event) => submitForm(onSaved, event)}
      />
    </AppLayout>
  );
};
