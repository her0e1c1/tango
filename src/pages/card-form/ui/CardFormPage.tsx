import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCard } from "@/entities/card";
import { CATEGORY } from "@/entities/deck";
import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardFormState } from "../model/useCardFormState";
import { runCardSave } from "../model/actions/runCardSave";
import { dismissSaveError } from "../model/actions/dismissSaveError";
import { CardEditor } from "./CardEditor";

const CardFormContent: React.FC<{ card: Card }> = ({ card }) => {
  const navigate = useNavigate();
  const goBack = () => navigate(-1);
  const editor = useCardFormState(card);
  const onSubmit = (event?: React.BaseSyntheticEvent) => {
    void editor.form.handleSubmit((values) =>
      runCardSave(values, {
        snapshot: editor.snapshot,
        savingRef: editor.savingRef,
        setIsSaving: editor.setIsSaving,
        saveErrorToastId: editor.saveErrorToastId,
        isMounted: editor.isMounted,
        onSaved: (deckId) => {
          const cardListPath = routes.cardList.to(deckId);
          void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
            navigate(cardListPath, { replace: true })
          );
        },
      })
    )(event);
  };
  const guard = useNavigationGuard(editor.form.formState.isDirty || editor.isSaving);

  const cancel = () => {
    dismissSaveError(editor.saveErrorToastId);
    void goBack();
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      <CardEditor
        cardInfo={{
          id: editor.snapshot.id,
          uniqueKey: editor.snapshot.uniqueKey,
          ...(editor.snapshot.createdAt ? { createdAt: editor.snapshot.createdAt } : {}),
          ...(editor.snapshot.lastSeenAt != null ? { lastSeenAt: editor.snapshot.lastSeenAt } : {}),
        }}
        categories={CATEGORY}
        form={editor.form}
        isSaving={editor.isSaving}
        onCancel={cancel}
        onSubmit={onSubmit}
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
