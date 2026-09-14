import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Deck } from "@/entities/deck";
import { DeckDeletionDialog } from "@/features/deck-deletion";
import { DeckForm } from "@/features/deck-form";
import { routes, useNavigationGuard } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckFormPageModel } from "../model/useDeckFormPageModel";
import { useOpeningDeck } from "../model/useOpeningDeck";
import { useDeckFormSubmit } from "./useDeckFormSubmit";

const DeckFormContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const {
    form,
    isDirty,
    isSubmitting,
    deletionTarget,
    deletionPending,
    submit,
    requestDeletion,
    cancelDeletion,
    confirmDeletion,
  } = useDeckFormPageModel(deck);
  const guard = useNavigationGuard(isDirty || isSubmitting);
  const onCompleted = () => guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  const onSubmit = useDeckFormSubmit(form.handleSubmit, (values) => submit(values, onCompleted));

  return (
    <AppLayout showHeader>
      {guard.element}
      {!guard.isBlocked && deletionTarget != null && (
        <DeckDeletionDialog
          target={deletionTarget}
          pending={deletionPending}
          onCancel={cancelDeletion}
          onConfirm={() => confirmDeletion(onCompleted)}
        />
      )}
      <DeckForm
        mode="edit"
        categories={CATEGORY}
        deckInfo={{
          id: deck.id,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        }}
        deckName={deck.name}
        form={form}
        isLocalOnly={deck.localMode}
        onCancel={() => void goToList()}
        onSubmit={onSubmit}
        afterForm={
          <section
            aria-labelledby="delete-deck-heading"
            className="mt-section-gap rounded-surface border border-danger p-4 md:p-5"
          >
            <h2 id="delete-deck-heading" className="text-title font-semibold text-danger">
              {t("deckDeletion.dangerTitle")}
            </h2>
            <p className="mt-1 text-body text-ink-muted">{t("deckDeletion.dangerDescription")}</p>
            <Button className="mt-4" variant="destructive" disabled={isSubmitting} onClick={requestDeletion}>
              {t("deckDeletion.confirm")}
            </Button>
          </section>
        }
      />
    </AppLayout>
  );
};

const DeckFormRouteContainer: React.FC<{ deckId: Deck["id"] }> = ({ deckId }) => {
  const { t } = useTranslation();
  const openingDeck = useOpeningDeck(deckId);

  if (openingDeck == null) {
    return <RouteNotFound title={t("deckForm.notFound.title")} description={t("deckForm.notFound.description")} />;
  }

  return <DeckFormContainer deck={openingDeck} />;
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Page-owned form and deletion state must not survive navigation to a different Deck.
  return <DeckFormRouteContainer key={deckId} deckId={deckId} />;
};
