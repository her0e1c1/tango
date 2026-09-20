import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { touchStudySession } from "@/entities/study-session";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import {
  useDeckDeletionState,
  getDeckDeletionTarget,
  requestDeckDeletion,
  cancelDeckDeletion,
  confirmDeckDeletion,
} from "@/features/deck-deletion";
import { bootstrapSampleDeck } from "./actions/bootstrapSampleDeck";
import { routes } from "@/shared/router";

import { exportDeck } from "./actions/exportDeck";
import { useDeckListState } from "./queries/useDeckListState";

export function useDeckListPageModel() {
  const navigate = useNavigate();
  const sections = useDeckListState();
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
      target: deletion.target,
      pending: deletion.pending,
      setTarget: deletion.setTarget,
      setPending: deletion.setPending,
      isMounted,
    });

  useEffect(() => {
    void bootstrapSampleDeck(decks, loadSample);
  }, [decks, loadSample]);
  useKey("s", () => void navigate(routes.settings.to()));
  useKey("i", () => void navigate(routes.deckImport.to()));

  return {
    sections,
    deletionTarget,
    deletionPending: deletion.pending,
    requestDeletion,
    cancelDeletion,
    confirmDeletion,
    createDeck: () => void navigate(routes.deckCreate.to()),
    importDeck: () => void navigate(routes.deckImport.to()),
    editDeck: (id: string) => void navigate(routes.deckForm.to(id)),
    openDeck: (id: string) => void navigate(routes.cardList.to(id)),
    continueStudy: (id: string) => {
      touchStudySession(id);
      void navigate(routes.deckStudy.to(id));
    },
    startStudy: (id: string) => void navigate(routes.deckStudyStart.to(id)),
    downloadDeck: (id: string) => exportDeck(id, decks, cards),
  };
}
