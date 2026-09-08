import * as React from "react";
import { useFormState } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { getAuthUid } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { CATEGORY, type Deck, useDeck, useDecks } from "@/entities/deck";
import {
  cancelDeckDeletion,
  confirmDeckDeletion,
  DeckDeletionDialog,
  getDeckDeletionTarget,
  requestDeckDeletion,
  useDeckDeletionState,
} from "@/features/deck-deletion";
import { DeckForm, type DeckFormFields } from "@/features/deck-form";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { routes, useNavigationGuard } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckFormPageModel } from "../model/useDeckFormPageModel";

const DeckFormContent: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const { form, submit } = useDeckFormPageModel(deck);
  const { isDirty, isSubmitting } = useFormState({ control: form.control });
  const guard = useNavigationGuard(isDirty || isSubmitting);
  const deletion = useDeckDeletionState();
  const decks = useDecks();
  const cards = useCards();
  const isMounted = useMountedGuard();
  const submissionPending = React.useRef(false);
  const deletionTarget = getDeckDeletionTarget(deletion.target);

  const save = async (values: DeckFormFields): Promise<void> => {
    if (!(await submit(values)) || !isMounted()) return;

    await guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList);
  };
  const handleSubmit = form.handleSubmit(save);
  const onSubmit: React.SubmitEventHandler<HTMLFormElement> = (event) => {
    if (submissionPending.current) {
      // RHF validation is asynchronous, so guard the entrance before isSubmitting can rerender the form.
      event.preventDefault();
      return;
    }

    submissionPending.current = true;
    void handleSubmit(event)
      .catch((error: unknown) => {
        // biome-ignore lint/suspicious/noConsole: Unexpected validation/navigation errors are not persistence failures.
        console.error("Deck edit form callback failed.", error);
      })
      .finally(() => {
        submissionPending.current = false;
      });
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
            <Button
              className="mt-4"
              variant="destructive"
              disabled={isSubmitting}
              onClick={() =>
                requestDeckDeletion(deck.id, {
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
