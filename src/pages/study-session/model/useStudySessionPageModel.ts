import { useStore } from "zustand";
import { studySessionPageStore } from "./store";
import { restorePendingStudy } from "./actions/restorePendingStudy";
import { retryStudy } from "./actions/retryStudy";
import { useEffect } from "react";
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

export function useStudySessionPageModel(deckId: DeckId) {
  const { uid } = useAuth();
  const query = useStudyQuery(deckId);
  const pending = useStore(studySessionPageStore);
  const pageState = useStudySessionPageState(uid, deckId);
  useEffect(() => enterStudySessionPage(uid, deckId), [uid, deckId]);
  useEffect(() => maintainStudySession(deckId, query.sessionState.status), [deckId, query.sessionState.status]);
  const session = query.sessionState.status === "studying" ? query.sessionState.session : undefined;
  useEffect(() => {
    if (session) restorePendingStudy(uid, session);
  }, [uid, session]);
  useAutoPlay(query.sessionState);
  return {
    query,
    retryStudy: () => void retryStudy(),
    hasPendingStudy:
      pending.owner?.uid === uid && pending.owner.deckId === deckId && pending.pendingOperation !== undefined,
    pendingReadFailed: pending.owner?.uid === uid && pending.owner.deckId === deckId && pending.pendingReadFailed,
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
