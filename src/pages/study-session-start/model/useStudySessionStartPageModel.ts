import { useEffect, useState } from "react";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useNavigate } from "react-router-dom";
import { routes } from "@/shared/router";

import { useAuth } from "@/entities/auth";
import { type Deck, useDeck } from "@/entities/deck";
import { useStudySession } from "@/entities/study-session";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";

import { startStudySession } from "./actions/startStudySession";
import { useStudyStartShortcut } from "./actions/useStudyStartShortcut";
import { useStudySessionStartState } from "./queries/useStudySessionStartState";

export function useStudySessionStartRouteModel(deckId: string) {
  const deck = useDeck(deckId);
  return { deckId, deck };
}

export function useStudySessionStartPageModel(deck: Deck) {
  const navigate = useNavigate();
  const isMounted = useMountedGuard();
  const [pendingSessionId, setPendingSessionId] = useState<string>();
  const session = useStudySession(deck.id);
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
    const sessionId = await startStudySession(deck.id, filterDraft.state.draft);
    if (sessionId !== undefined && isMounted()) setPendingSessionId(sessionId);
  };
  useEffect(() => {
    if (pendingSessionId === undefined || session?.sessionId !== pendingSessionId) return;
    void navigate(routes.deckStudy.to(deck.id), { replace: true });
  }, [deck.id, navigate, pendingSessionId, session?.sessionId]);
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
