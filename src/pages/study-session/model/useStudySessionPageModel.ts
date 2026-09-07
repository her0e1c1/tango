import { useEffect } from "react";
import { getAuthUid } from "@/entities/auth";
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

export function useStudySessionPageModel(deckId: DeckId) {
  const uid = getAuthUid();
  const query = useStudyQuery(deckId);
  const pageState = useStudySessionPageState(uid, deckId);
  useEffect(() => enterStudySessionPage(uid, deckId), [uid, deckId]);
  useEffect(() => maintainStudySession(deckId, query.sessionState.status), [deckId, query.sessionState.status]);
  useAutoPlay(query.sessionState);
  return {
    query,
    pageState,
    toggleBackText,
    toggleAutoPlay,
    openHelp,
    closeHelp,
    changeIndex: (index: number) => updateStudyIndex(deckId, index),
    swipeUp: () => void swipeCard(uid, deckId, "cardSwipeUp"),
    swipeDown: () => void swipeCard(uid, deckId, "cardSwipeDown"),
    swipeLeft: () => void swipeCard(uid, deckId, "cardSwipeLeft"),
    swipeRight: () => void swipeCard(uid, deckId, "cardSwipeRight"),
  };
}
