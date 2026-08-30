import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-deletion";
import { DeckForm } from "@/features/deck-form";
import { routes, useNavigationGuard } from "@/shared/router";
import { Button } from "@/shared/ui/button";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckForm } from "../model/useDeckForm";

const DeckFormContent: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  const deckListPath = routes.deckList.to();
  const goToList = () => navigate(deckListPath, { replace: true });
  const cancel = () => void goToList();
  const editor = useDeckForm({
    deckId,
    onSaved: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
  });
  const guard = useNavigationGuard(editor != null && (editor.isDirty || editor.isSaving));
  const deletion = useDeckDeletion({
    onDeleted: () => void guard.allowNavigation({ historyAction: "REPLACE", to: deckListPath }, goToList),
  });

  if (editor == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      {guard.element}
      {!guard.isBlocked && deletion.target != null && (
        <DeckDeletionDialog target={deletion.target} onCancel={deletion.cancel} onConfirm={deletion.confirm} />
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
        saveError={editor.saveError}
        onSubmit={editor.onSubmit}
        afterForm={
          <section
            aria-labelledby="delete-deck-heading"
            className="mt-section-gap rounded-surface border border-danger p-4 md:p-5"
          >
            <h2 id="delete-deck-heading" className="text-title font-semibold text-danger">
              Danger zone
            </h2>
            <p className="mt-1 text-body text-ink-muted">Permanently delete this deck, its cards, and study session.</p>
            <Button className="mt-4" variant="destructive" onClick={() => deletion.request(editor.deckInfo.id)}>
              Delete deck
            </Button>
          </section>
        }
      />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Page-owned form and deletion state must not survive navigation to a different Deck.
  return <DeckFormContent key={deckId} deckId={deckId} />;
};
