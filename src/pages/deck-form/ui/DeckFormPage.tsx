import * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Deck, useDeck, useDecks } from "@/entities/deck";
import {
  DeckDeletionDialog,
  useDeckDeletionState,
  getDeckDeletionTarget,
  requestDeckDeletion,
  cancelDeckDeletion,
  confirmDeckDeletion,
} from "@/features/deck-deletion";
import { DeckForm } from "@/features/deck-form";
import { routes, useNavigationGuard } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckFormState } from "../model/useDeckFormState";
import { saveDeck } from "../model/actions/saveDeck";
import { getAuthUid } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { dismissSaveError } from "../model/actions/dismissSaveError";

const DeckFormContent: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const editor = useDeckFormState(deck);
  const onSubmit = (event?: React.BaseSyntheticEvent) => {
    void editor.form.handleSubmit((values) =>
      saveDeck(values, {
        uid: getAuthUid(),
        snapshot: editor.snapshot,
        savingRef: editor.savingRef,
        setIsSaving: editor.setIsSaving,
        saveErrorToastId: editor.saveErrorToastId,
        isMounted: editor.isMounted,
        onSaved: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
      })
    )(event);
  };
  const guard = useNavigationGuard(editor.form.formState.isDirty || editor.isSaving);
  const deletion = useDeckDeletionState();
  const decks = useDecks();
  const cards = useCards();
  const isMounted = useMountedGuard();
  const deletionTarget = getDeckDeletionTarget(deletion.target);

  const cancel = () => {
    dismissSaveError(editor.saveErrorToastId);
    void goToList();
  };

  return (
    <AppLayout showHeader>
      {guard.element}
      {!guard.isBlocked && deletionTarget != null && (
        <DeckDeletionDialog
          target={deletionTarget}
          pending={deletion.pending}
          onCancel={() => cancelDeckDeletion({ pending: deletion.pending, setTarget: deletion.setTarget })}
          onConfirm={() =>
            confirmDeckDeletion({
              uid: getAuthUid(),
              target: deletion.target,
              pending: deletion.pending,
              setTarget: deletion.setTarget,
              setPending: deletion.setPending,
              isMounted,
              onDeleted: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
            })
          }
        />
      )}
      <DeckForm
        mode="edit"
        categories={CATEGORY}
        deckInfo={{
          id: editor.snapshot.id,
          createdAt: editor.snapshot.createdAt,
          updatedAt: editor.snapshot.updatedAt,
        }}
        deckName={editor.snapshot.name}
        form={editor.form}
        isLocalOnly={editor.snapshot.localMode}
        isSaving={editor.isSaving}
        onCancel={cancel}
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
            <Button
              className="mt-4"
              variant="destructive"
              disabled={editor.isSaving}
              onClick={() =>
                requestDeckDeletion(editor.snapshot.id, {
                  pending: deletion.pending,
                  decks,
                  cards,
                  setTarget: deletion.setTarget,
                })
              }
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
