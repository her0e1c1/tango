import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-deletion";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useDeckFormState } from "../model/useDeckFormState";
import { DeckEditor } from "./DeckEditor";

export const DeckFormContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const navigate = useNavigate();
  const goToList = () => void navigate(routes.deckList.to(), { replace: true });
  const editor = useDeckFormState({ deckId, onCancel: goToList, onSaved: goToList });
  const deletion = useDeckDeletion({ onDeleted: goToList });

  if (editor == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      {deletion.target != null && (
        <DeckDeletionDialog target={deletion.target} onCancel={deletion.cancel} onConfirm={deletion.confirm} />
      )}
      <DeckEditor
        deckName={editor.deckName}
        form={editor.form}
        saveError={editor.saveError}
        onDelete={() => deletion.request(editor.form.deckInfo.id)}
      />
    </AppLayout>
  );
};
