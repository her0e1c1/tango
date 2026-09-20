import { useNavigate } from "react-router-dom";
import { useKey } from "react-use";
import { useAuth } from "@/entities/auth";
import type { Deck } from "@/entities/deck";
import { useStudySessionSyncStatus } from "@/entities/study-session";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  clearDeckFilterRange,
  useDeckFilterSaveLifecycle,
  updateDeckFilterDraft,
} from "@/features/deck-filter";
import { routes } from "@/shared/router";
import { startDeckStudy } from "./actions/startDeckStudy";
import {
  getStudyStartAvailability,
  isInteractiveShortcutTarget,
  useStudySessionStartState,
} from "./queries/useStudySessionStartState";

export function useStudySessionStartPageModel(deck: Deck) {
  const navigate = useNavigate();
  const { uid, isAnonymous } = useAuth();
  const syncStatus = useStudySessionSyncStatus();
  const filterDraft = useDeckFilterDraft(uid, deck);
  useDeckFilterSaveLifecycle(filterDraft.state.pending, filterDraft.setState);
  const filterUpdate = { uid, deckId: deck.id, draft: filterDraft.state.draft, setState: filterDraft.setState };
  const filter = getDeckFilterState(filterDraft.state);
  const state = useStudySessionStartState({
    ...deck,
    difficultyMax: filter.difficultyMax,
    difficultyMin: filter.difficultyMin,
    selectedTags: filter.selectedTags,
    tagAndFilter: filter.tagAndFilter,
  });
  const availability = getStudyStartAvailability(deck.localMode, isAnonymous, syncStatus, filter.saving);
  const start = () => {
    if (availability.disabled) return;
    if (startDeckStudy({ uid, isAnonymous }, deck, state.cards, state.studyPreferences)) {
      void navigate(routes.deckStudy.to(deck.id), { replace: true });
    }
  };
  const startFromEnter = (event: KeyboardEvent) => {
    if (!isInteractiveShortcutTarget(event.target)) start();
  };
  useKey("Enter", startFromEnter, {}, [startFromEnter]);
  return {
    state,
    filter,
    ...availability,
    start,
    clearDifficultyRange: () => clearDeckFilterRange(filterUpdate),
    setDifficultyMax: (difficultyMax: Deck["difficultyMax"]) => updateDeckFilterDraft({ difficultyMax }, filterUpdate),
    setDifficultyMin: (difficultyMin: Deck["difficultyMin"]) => updateDeckFilterDraft({ difficultyMin }, filterUpdate),
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
  };
}
