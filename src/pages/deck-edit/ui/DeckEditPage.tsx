import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import type { Deck } from "@/entities/deck";
import { DeckDeletionDialog } from "@/features/deck-deletion";
import { DeckForm } from "@/features/deck-form";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckEditPageModel, useDeckEditRouteModel } from "../model/useDeckEditPageModel";

const DeckEditContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const model = useDeckEditPageModel(deck);

  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      {model.deletionTarget != null && (
        <DeckDeletionDialog
          target={model.deletionTarget}
          pending={model.deletionPending}
          onCancel={model.cancelDeletion}
          onConfirm={model.confirmDeletion}
        />
      )}
      <DeckForm
        mode="edit"
        categories={model.categories}
        cloudStorageAvailable={model.cloudStorageAvailable}
        deckInfo={{
          id: deck.id,
          createdAt: deck.createdAt,
          updatedAt: deck.updatedAt,
        }}
        deckName={deck.name}
        form={model.form}
        isLocalOnly={deck.localMode}
        onCancel={model.onCancel}
        onSubmit={model.onSubmit}
        afterForm={
          <section
            aria-labelledby="delete-deck-heading"
            className="mt-section-gap rounded-surface border border-danger p-4 md:p-5"
          >
            <h2 id="delete-deck-heading" className="text-title font-semibold text-danger">
              {t("deckDeletion.dangerTitle")}
            </h2>
            <p className="mt-1 text-body text-ink-muted">{t("deckDeletion.dangerDescription")}</p>
            <Button
              className="mt-4"
              variant="destructive"
              disabled={model.isSubmitting}
              onClick={model.requestDeletion}
            >
              {t("deckDeletion.confirm")}
            </Button>
          </section>
        }
      />
    </AppLayout>
  );
};

export const DeckEditPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { deckId, openingDeck } = useDeckEditRouteModel(params.id);

  if (openingDeck == null) {
    return <RouteNotFound title={t("deckForm.notFound.title")} description={t("deckForm.notFound.description")} />;
  }

  // Page-owned form and deletion state must not survive navigation to a different Deck.
  return <DeckEditContainer key={deckId} deck={openingDeck} />;
};
