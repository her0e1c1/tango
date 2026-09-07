import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { touchStudySession } from "@/entities/study-session";
import { useAuth } from "@/entities/auth";
import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import {
  DeckDeletionDialog,
  useDeckDeletionState,
  getDeckDeletionTarget,
  requestDeckDeletion,
  cancelDeckDeletion,
  confirmDeckDeletion,
} from "@/features/deck-deletion";
import { bootstrapSampleDeck } from "@/features/sample-import";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { exportDeck } from "../model/actions/exportDeck";
import { useDeckListState } from "../model/queries/useDeckListState";
import { DeckList } from "./DeckList";

export const DeckListPage: React.FC = () => {
  const navigate = useNavigate();
  const sections = useDeckListState();
  const { uid } = useAuth();
  const cards = useCards();
  const decks = useDecks();
  const { loadSample } = usePreferences();
  const isMounted = useMountedGuard();
  const deletion = useDeckDeletionState();
  const deletionTarget = getDeckDeletionTarget(deletion.target);
  const requestDeletion = (id: string) =>
    requestDeckDeletion(id, { pending: deletion.pending, decks, cards, setTarget: deletion.setTarget });
  const cancelDeletion = () => cancelDeckDeletion({ pending: deletion.pending, setTarget: deletion.setTarget });
  const confirmDeletion = () =>
    confirmDeckDeletion({
      uid,
      target: deletion.target,
      pending: deletion.pending,
      setTarget: deletion.setTarget,
      setPending: deletion.setPending,
      isMounted,
    });

  const continueStudy = (id: string) => {
    // The Entity owns session recency while this route entry owns the destination shown afterward.
    touchStudySession(id);
    void navigate(routes.deckStudy.to(id));
  };

  React.useEffect(() => {
    void bootstrapSampleDeck(uid, decks, loadSample);
  }, [uid, decks, loadSample]);
  useKey("s", () => void navigate(routes.settings.to()));
  useKey("i", () => void navigate(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      {deletionTarget != null && (
        <DeckDeletionDialog
          target={deletionTarget}
          pending={deletion.pending}
          onCancel={cancelDeletion}
          onConfirm={confirmDeletion}
        />
      )}
      <DeckList
        sections={sections}
        onCreateDeck={() => void navigate(routes.deckCreate.to())}
        deckCard={{
          onClickEdit: (id) => void navigate(routes.deckForm.to(id)),
          onClickName: (id) => void navigate(routes.cardList.to(id)),
          onClickContinue: continueStudy,
          onClickRestart: (id) => void navigate(routes.deckStudyStart.to(id)),
          onClickStudy: (id) => void navigate(routes.deckStudyStart.to(id)),
          onClickDownload: (id) => exportDeck(id, decks, cards),
          onClickDelete: requestDeletion,
        }}
      />
    </AppLayout>
  );
};
