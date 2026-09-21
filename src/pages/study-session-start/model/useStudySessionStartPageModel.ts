import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useNavigate } from "react-router-dom";
import { routes } from "@/shared/router";

import { useAuth } from "@/entities/auth";
import { type Deck, useDeck } from "@/entities/deck";
import {
  useDeckFilterDraft,
  getDeckFilterState,
  clearDeckFilterRange,
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
    if (filter.saving) return;
    if ((await startStudySession(deck.id, filterDraft.state.draft)) && isMounted()) {
      void navigate(routes.deckStudy.to(deck.id), { replace: true });
    }
  };
  useStudyStartShortcut(
    () => {
      void start();
    },
    { saving: filter.saving, cardCount: state.cardsLength }
  );

  return {
    deckName: deck.name,
    maxNumberOfCardsToLearn: state.maxNumberOfCardsToLearn,
    cardsLength: state.cardsLength,
    tags: state.tags,
    filter,
    start: () => {
      void start();
    },
    clearDifficultyRange: () => clearDeckFilterRange(filterUpdate),
    setDifficultyMax: (difficultyMax: number | null) => updateDeckFilterDraft({ difficultyMax }, filterUpdate),
    setDifficultyMin: (difficultyMin: number | null) => updateDeckFilterDraft({ difficultyMin }, filterUpdate),
    setSelectedTags: (selectedTags: string[]) => updateDeckFilterDraft({ selectedTags }, filterUpdate),
    setTagAndFilter: (tagAndFilter: boolean) => updateDeckFilterDraft({ tagAndFilter }, filterUpdate),
  };
}
