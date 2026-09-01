import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardForm } from "../model/useCardForm";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ cardId: string }> = ({ cardId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const editor = useCardForm({
    cardId,
    onSaved: (deckId) => {
      const cardListPath = routes.cardList.to(deckId);
      void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
        navigate(cardListPath, { replace: true })
      );
    },
  });
  const guard = useNavigationGuard(editor != null && (editor.isDirty || editor.isSaving));

  if (editor == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  const cancel = () => {
    editor.dismissSaveError();
    void goBack();
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <CardEditor
        cardInfo={editor.cardInfo}
        categories={editor.categories}
        form={editor.form}
        isSaving={editor.isSaving}
        onCancel={cancel}
        onSubmit={editor.onSubmit}
      />
    </AppLayout>
  );
};

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContent key={cardId} cardId={cardId} />;
};
