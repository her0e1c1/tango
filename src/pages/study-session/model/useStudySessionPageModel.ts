import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  type SwipeDirection,
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

export function useStudySessionPageModel(deckId: DeckId) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const query = useStudyQuery(deckId);
  const pageState = useStudySessionPageState(uid, deckId);
  useEffect(() => enterStudySessionPage(uid, deckId), [uid, deckId]);
  useEffect(() => maintainStudySession(deckId), [deckId, query.sessionState.status]);
  useAutoPlay(query.sessionState);
  const swipe = async (direction: SwipeDirection) => {
    if (await swipeCard(deckId, direction)) await navigate(routes.deckList.to(), { replace: true });
  };
  useStudyShortcuts({
    onSwipe: (direction) => void swipe(direction),
    status: query.status,
    helpOpen: pageState.helpOpen,
    showBackText: pageState.showBackText,
  });

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
    swipeUp: () => void swipe("cardSwipeUp"),
    swipeDown: () => void swipe("cardSwipeDown"),
    swipeLeft: () => void swipe("cardSwipeLeft"),
    swipeRight: () => void swipe("cardSwipeRight"),
  };
}
