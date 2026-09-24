import { useEffect } from "react";
import { useStore } from "zustand";
import { useNavigate } from "react-router-dom";
import {
  toggleViewMode,
  toggleShowViewMode,
  toggleShowHelp,
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSkip,
  toggleShowSwipeButtonList,
} from "@/entities/preference";
import { routes } from "@/shared/router";
import { useStudyShortcuts } from "./useStudyShortcuts";
import { useAuth } from "@/entities/auth";
import type { DeckId } from "@/entities/deck";
import { closeHelp } from "./actions/closeHelp";
import { enterStudySessionPage } from "./actions/enterStudySessionPage";
import { maintainStudySession } from "./actions/maintainStudySession";
import { openHelp } from "./actions/openHelp";
import { swipeCard } from "./actions/swipeCard";
import { toggleAutoPlay } from "./actions/toggleAutoPlay";
import { toggleBackText } from "./actions/toggleBackText";
import { updateStudyIndex } from "./actions/updateStudyIndex";
import { useAutoPlay } from "./actions/useAutoPlay";
import { useStudyQuery } from "./queries/useStudyQuery";
import { useStudySessionPageState } from "./queries/useStudySessionPageState";
import { skipCard } from "./actions/skipCard";
import { showStudyResult } from "./actions/showStudyResult";
import { studySessionPageStore } from "./store";

export function useStudySessionPageModel(deckId: DeckId) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const query = useStudyQuery(deckId);
  const pageState = useStudySessionPageState(uid, deckId);
  const pendingResult = useStore(studySessionPageStore, (state) => state.pendingResult);
  useEffect(() => enterStudySessionPage(uid, deckId), [uid, deckId]);
  useEffect(() => maintainStudySession(deckId), [deckId, query.sessionState.status]);
  useAutoPlay(query.sessionState);
  useStudyShortcuts({
    deckId,
    status: query.status,
    helpOpen: pageState.helpOpen,
    showBackText: pageState.showBackText,
  });
  useEffect(() => {
    if (pendingResult?.deckId !== deckId) return;
    const reflected = pendingResult.completed
      ? query.sessionId !== pendingResult.sessionId
      : query.sessionState.status === "studying" &&
        query.sessionState.session.sessionId === pendingResult.sessionId &&
        query.sessionState.session.currentIndex === pendingResult.currentIndex;
    if (!reflected) return;
    showStudyResult(pendingResult.completed, pendingResult.cardCount, pendingResult.direction);
    studySessionPageStore.setState({ isSaving: false, pendingResult: undefined });
  }, [deckId, pendingResult, query.sessionId, query.sessionState]);
  useEffect(() => {
    if (query.status !== "invalid" || pageState.completion != null || pageState.swipePending) return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, query.status, pageState.completion, pageState.swipePending]);

  return {
    goBack: () => void navigate(routes.deckList.to()),
    finish: () => void navigate(routes.deckList.to(), { replace: true }),
    toggleViewMode,
    toggleShowViewMode,
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSkip,
    toggleShowSwipeButtonList,
    query,
    pageState,
    toggleBackText,
    toggleAutoPlay,
    openHelp,
    closeHelp,
    changeIndex: (index: number) => void updateStudyIndex(deckId, index),
    skip: () => void skipCard(deckId),
    swipeUp: () => void swipeCard(deckId, "cardSwipeUp"),
    swipeDown: () => void swipeCard(deckId, "cardSwipeDown"),
    swipeLeft: () => void swipeCard(deckId, "cardSwipeLeft"),
    swipeRight: () => void swipeCard(deckId, "cardSwipeRight"),
  };
}
