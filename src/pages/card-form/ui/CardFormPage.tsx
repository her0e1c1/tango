import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardForm } from "../model/useCardForm";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ card: Card }> = ({ card }) => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const editor = useCardForm({
    card,
    onSaved: (deckId) => {
      const cardListPath = routes.cardList.to(deckId);
      void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
        navigate(cardListPath, { replace: true })
      );
    },
  });
  const guard = useNavigationGuard(editor.isDirty || editor.isSaving);

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
  const { t } = useTranslation();
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);

  if (card == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContent key={cardId} card={card} />;
};
