import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type Deck, useDeck } from "@/entities/deck";
import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-deletion";
import { DeckForm } from "@/features/deck-form";
import { routes, useNavigationGuard } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckForm } from "../model/useDeckForm";

const DeckFormContent: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const editor = useDeckForm({
    deck,
    onSaved: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
  });
  const guard = useNavigationGuard(editor.isDirty || editor.isSaving);
  const deletion = useDeckDeletion({
    onDeleted: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
  });

  const cancel = () => {
    editor.dismissSaveError();
    void goToList();
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      {!guard.isBlocked && deletion.target != null && (
        <DeckDeletionDialog
          target={deletion.target}
          pending={deletion.pending}
          onCancel={deletion.cancel}
          onConfirm={deletion.confirm}
        />
      )}
      <DeckForm
        mode="edit"
        categories={editor.categories}
        deckInfo={editor.deckInfo}
        deckName={editor.deckName}
        form={editor.form}
        isLocalOnly={editor.isLocalOnly}
        isSaving={editor.isSaving}
        onCancel={cancel}
        onSubmit={editor.onSubmit}
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
              disabled={editor.isSaving}
              onClick={() => deletion.request(editor.deckInfo.id)}
            >
              {t("deckDeletion.confirm")}
            </Button>
          </section>
        }
      />
    </AppLayout>
  );
};

const DeckFormRoutePage: React.FC<{ deckId: Deck["id"] }> = ({ deckId }) => {
  const { t } = useTranslation();
  const deck = useDeck(deckId);
  const [openingDeck, setOpeningDeck] = React.useState(deck);

  if (openingDeck === undefined && deck !== undefined) setOpeningDeck(deck);

  if (openingDeck == null) {
    return <RouteNotFound title={t("deckForm.notFound.title")} description={t("deckForm.notFound.description")} />;
  }

  // Keep the opening snapshot mounted until this route ends so its own successful deletion can finish navigation.
  return <DeckFormContent deck={openingDeck} />;
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Page-owned form and deletion state must not survive navigation to a different Deck.
  return <DeckFormRoutePage key={deckId} deckId={deckId} />;
};
