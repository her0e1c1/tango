import type * as React from "react";
import { useKey } from "react-use";

import { touchStudySession } from "@/entities/study-session";
import { useAddSampleDeck } from "@/features/deck-import";
import { routes, useNavigation } from "@/shared/router";
import { DestructiveActionDialog } from "@/shared/ui/destructive-action-dialog";
import { Feedback } from "@/shared/ui/feedback";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckDeletion } from "../model/useDeckDeletion";
import { useDeckExport } from "../model/useDeckExport";
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
      {deletion.target != null && (
        <DestructiveActionDialog
          title="Delete deck?"
          targetLabel="Deck"
          targetName={deletion.target.deckName}
          confirmLabel="Delete deck"
          {...(deletion.target.hasError
            ? { errorMessage: "Unable to delete this deck. Check your connection and try again." }
            : {})}
          description={
            <>
              <p>
                This permanently deletes {deletion.target.cardCount}{" "}
                {deletion.target.cardCount === 1 ? "card" : "cards"} in this deck.
              </p>
              <p>Any in-progress study session for this deck will also end.</p>
              <p>This action cannot be undone.</p>
            </>
          }
          onCancel={deletion.cancel}
          onConfirm={deletion.confirm}
        />
      )}
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
