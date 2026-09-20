import { useEffect } from "react";
import { useAuth } from "@/entities/auth";
import { type DeckId, useDeck } from "@/entities/deck";
import { useNavigate } from "react-router-dom";
import { useKey, useLatest } from "react-use";
import { routes } from "@/shared/router";
import {
  toggleShowHelp,
  toggleShowCardDetails,
  toggleShowPlaybackControls,
  toggleShowSwipeButtonList,
} from "@/entities/preference";
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

import { runStudyShortcut } from "./actions/runStudyShortcut";
import type { StudyShortcutAction } from "./queries/canRunStudyShortcut";

export function useStudySessionRouteModel(deckId: string | undefined) {
  if (deckId == null) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  return { deckId, deck };
}

export function useStudySessionPageModel(deckId: DeckId) {
  const navigate = useNavigate();
  const { uid } = useAuth();
  const query = useStudyQuery(deckId);
  const pageState = useStudySessionPageState(uid, deckId);
  useEffect(() => enterStudySessionPage(uid, deckId), [uid, deckId]);
  useEffect(() => maintainStudySession(deckId, query.sessionState.status), [deckId, query.sessionState.status]);
  useAutoPlay(query.sessionState);
  const swipeUp = () => void swipeCard(uid, deckId, "cardSwipeUp");
  const swipeDown = () => void swipeCard(uid, deckId, "cardSwipeDown");
  const swipeLeft = () => void swipeCard(uid, deckId, "cardSwipeLeft");
  const swipeRight = () => void swipeCard(uid, deckId, "cardSwipeRight");
  const latestShortcuts = useLatest({
    status: query.status,
    helpOpen: pageState.helpOpen,
    showBackText: pageState.showBackText,
    swipeUp,
    swipeDown,
    swipeLeft,
    swipeRight,
    toggleBackText,
    toggleAutoPlay,
    toggleSwipeButtonList: toggleShowSwipeButtonList,
  });
  const runShortcut = (action: StudyShortcutAction) => (event: KeyboardEvent) => {
    const current = latestShortcuts.current;
    runStudyShortcut(
      event,
      action,
      { status: current.status, helpOpen: current.helpOpen, showBackText: current.showBackText },
      current[action]
    );
  };

  // Retained key handlers read current page state through the stable ref.
  useKey("ArrowUp", runShortcut("swipeUp"));
  useKey("ArrowDown", runShortcut("swipeDown"));
  useKey("ArrowLeft", runShortcut("swipeLeft"));
  useKey("ArrowRight", runShortcut("swipeRight"));
  useKey("Enter", runShortcut("toggleBackText"));
  useKey("b", runShortcut("toggleSwipeButtonList"));
  useKey(" ", runShortcut("toggleAutoPlay"));

  useEffect(() => {
    if (query.status !== "invalid" || pageState.completion != null) return;
    void navigate(routes.deckList.to(), { replace: true });
  }, [navigate, query.status, pageState.completion]);

  return {
    query,
    pageState,
    goBack: () => void navigate(routes.deckList.to()),
    finish: () => void navigate(routes.deckList.to(), { replace: true }),
    toggleShowHelp,
    toggleShowCardDetails,
    toggleShowPlaybackControls,
    toggleShowSwipeButtonList,
    toggleBackText,
    toggleAutoPlay,
    openHelp,
    closeHelp,
    changeIndex: (index: number) => updateStudyIndex(deckId, index),
    swipeUp,
    swipeDown,
    swipeLeft,
    swipeRight,
  };
}
