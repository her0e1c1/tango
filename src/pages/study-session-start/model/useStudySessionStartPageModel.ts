import { useState } from "react";
import { useMountedAbortSignal } from "@/shared/lib/useMountedAbortSignal";
import { useNavigate } from "react-router-dom";
import { routes } from "@/shared/router";

import { useAuth } from "@/entities/auth";
import { type Deck, useDeck } from "@/entities/deck";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";

import { startStudyAndWait } from "./actions/startStudyAndWait";
import { useStudyStartShortcut } from "./actions/useStudyStartShortcut";
import { useStudySessionStartState } from "./queries/useStudySessionStartState";

export function useStudySessionStartRouteModel(deckId: string) {
  const deck = useDeck(deckId);
  return { deckId, deck };
}

export function useStudySessionStartPageModel(deck: Deck) {
  const navigate = useNavigate();
  const [pendingSessionId, setPendingSessionId] = useState<string | undefined>(undefined);
  const getSignal = useMountedAbortSignal();
  const { uid } = useAuth();
  const filterDraft = useDeckFilterDraft(uid, deck);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = {
    uid,
    deckId: deck.id,
    draft: filterDraft.state.draft,
    setState: filterDraft.setState,
  };
  const filter = getDeckFilterState(filterDraft.state);
  // Build the session from the latest selection, even while its autosave is still pending.
  const state = useStudySessionStartState(deck.id, filterDraft.state.draft);
  const start = async () => {
    if (filter.saving || pendingSessionId !== undefined) return;
    const signal = getSignal();
    if (signal === undefined) return;
    const ready = await startStudyAndWait(deck.id, filterDraft.state.draft, setPendingSessionId, signal);
    if (ready && !signal.aborted) void navigate(routes.deckStudy.to(deck.id), { replace: true });
  };
  useStudyStartShortcut(
    () => {
      void start();
    },
    { saving: filter.saving || pendingSessionId !== undefined, cardCount: state.cardsLength }
  );

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: state.maxNumberOfCardsToLearn,
    cardsLength: state.cardsLength,
    tags: state.tags,
    filter: { ...filter, saving: filter.saving || pendingSessionId !== undefined },
    start: () => {
      void start();
    },
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
  };
}
