import type * as React from "react";
import { useKey } from "react-use";

import { touchStudySession } from "@/entities/study-session";
import { DeckDeletionDialog, useDeckDeletion } from "@/features/deck-delete";
import { useDeckExport } from "@/features/deck-export";
import { useAddSampleDeck } from "@/features/deck-import";
import { routes, useNavigation } from "@/features/navigate";
import { Feedback } from "@/shared/ui/feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckListState } from "../model/useDeckListState";
import { DeckList } from "./DeckList";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const deckList = useDeckListState();
  const deletion = useDeckDeletion();
  const exportDeck = useDeckExport();

  const continueStudy = (id: string) => {
    // The Entity owns session recency while this route entry owns the destination shown afterward.
    touchStudySession(id);
    void navigation.to(routes.deckStudy.to(id));
  };

  useAddSampleDeck();
  useKey("s", () => void navigation.to(routes.settings.to()));
  useKey("i", () => void navigation.to(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <Feedback tone="success">{deletion.successMessage}</Feedback>
      <DeckDeletionDialog target={deletion.target} onCancel={deletion.cancel} onConfirm={deletion.confirm} />
      <DeckList
        sections={deckList.sections}
        deckCard={{
          onClickEdit: (id) => void navigation.to(routes.deckForm.to(id)),
          onClickName: (id) => void navigation.to(routes.cardList.to(id)),
          onClickContinue: continueStudy,
          onClickRestart: (id) => void navigation.to(routes.deckStudyStart.to(id)),
          onClickStudy: (id) => void navigation.to(routes.deckStudyStart.to(id)),
          onClickDownload: exportDeck,
          onClickDelete: deletion.request,
        }}
      />
    </AppLayout>
  );
};
