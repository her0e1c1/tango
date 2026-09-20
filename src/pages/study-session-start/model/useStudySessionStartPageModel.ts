import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";

import { useAuth } from "@/entities/auth";
import { type Deck, useDeck } from "@/entities/deck";
import { startStudy } from "@/entities/study-session";
import { routes } from "@/shared/router";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  clearDeckFilterRange,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";

import { canStartStudyFromEnter } from "./queries/canStartStudyFromEnter";
import { useStudySessionStartState } from "./queries/useStudySessionStartState";

export function useStudySessionStartRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  return { deckId, deck };
}

export function useStudySessionStartPageModel(deck: Deck) {
  const navigate = useNavigate();
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
  const state = useStudySessionStartState(deck, filter);
  const start = () => {
    startStudy(deck.id, state.cards, state.studyPreferences);
    void navigate(routes.deckStudy.to(deck.id), { replace: true });
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (!canStartStudyFromEnter(event, filter.saving, state.cardsLength)) return;
    start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);

  return {
    ...state,
    filter,
    start,
    clearDifficultyRange: () => clearDeckFilterRange(filterUpdate),
    setDifficultyMax: (difficultyMax: number | null) => updateDeckFilterDraft({ difficultyMax }, filterUpdate),
    setDifficultyMin: (difficultyMin: number | null) => updateDeckFilterDraft({ difficultyMin }, filterUpdate),
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
  };
}
