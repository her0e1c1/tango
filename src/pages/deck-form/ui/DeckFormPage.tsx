import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-deletion";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckForm } from "../model/useDeckForm";
import { DeckEditor } from "./DeckEditor";

const DeckFormContent: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  const goToList = () => void navigate(routes.deckList.to(), { replace: true });
  const editor = useDeckForm({ deckId, onSaved: goToList });
  const deletion = useDeckDeletion({ onDeleted: goToList });

  if (editor == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  const cancel = () => {
    editor.dismissSaveError();
    goToList();
  };

  return (
    <AppLayout showHeader>
      {deletion.target != null && (
        <DeckDeletionDialog
          target={deletion.target}
          pending={deletion.pending}
          onCancel={deletion.cancel}
          onConfirm={deletion.confirm}
        />
      )}
      <DeckEditor
        categories={editor.categories}
        deckInfo={editor.deckInfo}
        deckName={editor.deckName}
        form={editor.form}
        isLocalOnly={editor.isLocalOnly}
        onCancel={cancel}
        onDelete={() => deletion.request(editor.deckInfo.id)}
        onSubmit={editor.onSubmit}
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
