import { useNavigate } from "react-router-dom";

import { useAuth } from "@/entities/auth";
import { type Deck, useDeck } from "@/entities/deck";
import { startStudySession } from "./actions/startStudySession";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  clearDeckFilterRange,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";

import { useStudyStartShortcut } from "./actions/useStudyStartShortcut";
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
  const state = useStudySessionStartState(deck.id, filterDraft.state.draft);
  const start = () => startStudySession(deck.id, state.cards, state.studyPreferences, navigate);
  useStudyStartShortcut(start, { saving: filter.saving, cardCount: state.cardsLength });

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: state.maxNumberOfCardsToLearn,
    cardsLength: state.cardsLength,
    tags: state.tags,
    filter,
    start,
    clearDifficultyRange: () => clearDeckFilterRange(filterUpdate),
    setDifficultyMax: (difficultyMax: number | null) => updateDeckFilterDraft({ difficultyMax }, filterUpdate),
    setDifficultyMin: (difficultyMin: number | null) => updateDeckFilterDraft({ difficultyMin }, filterUpdate),
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
  };
}
