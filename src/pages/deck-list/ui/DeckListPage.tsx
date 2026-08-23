import type * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { touchStudySession } from "@/entities/study-session";
import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-deletion";
import { useAddSampleDeck } from "@/features/sample-deck";
import { routes } from "@/shared/router";
import { Feedback } from "@/shared/ui/feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckExport } from "../model/useDeckExport";
import { useDeckListState } from "../model/useDeckListState";
import { DeckList } from "./DeckList";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const deckList = useDeckListState();
  const deletion = useDeckDeletion();
  const exportDeck = useDeckExport();

  const continueStudy = (id: string) => {
    // The Entity owns session recency while this route entry owns the destination shown afterward.
    touchStudySession(id);
    void navigate(routes.deckStudy.to(id));
  };

  useAddSampleDeck();
  useKey("s", () => void navigate(routes.settings.to()));
  useKey("i", () => void navigate(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <Feedback tone="success">{deletion.successMessage}</Feedback>
      {deletion.target != null && (
        <DeckDeletionDialog target={deletion.target} onCancel={deletion.cancel} onConfirm={deletion.confirm} />
      )}
      <DeckList
        sections={deckList.sections}
        onCreateDeck={() => void navigate(routes.deckCreate.to())}
        deckCard={{
          onClickEdit: (id) => void navigate(routes.deckForm.to(id)),
          onClickName: (id) => void navigate(routes.cardList.to(id)),
          onClickContinue: continueStudy,
          onClickRestart: (id) => void navigate(routes.deckStudyStart.to(id)),
          onClickStudy: (id) => void navigate(routes.deckStudyStart.to(id)),
          onClickDownload: exportDeck,
          onClickDelete: deletion.request,
        }}
      />
    </AppLayout>
  );
};
