import { useStore } from "zustand";
import { useAuth } from "@/entities/auth";
import { studySessionPageStore } from "../store";
import { useCards } from "@/entities/card";
import type { Card } from "@/entities/card";
import { getCategory, isHighlightLanguage, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { resolveStudySession, useStudySession, useRemoteStudySessionsLoading } from "@/entities/study-session";
import { buildCardPlayerHelpRows } from "@/features/card-player";

export type StudySessionState = ReturnType<typeof resolveStudySession<Card>>;

export const useStudyQuery = (deckId: string) => {
  const cards = useCards();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const remoteSession = useStudySession(deckId);
  const { uid } = useAuth();
  const savingSession = useStore(studySessionPageStore, (state) => state.savingSession);
  const savingSnapshot = useStudySession(savingSession?.deckId ?? deckId);
  const awaitingRollback = useStore(studySessionPageStore, (state) => state.awaitingRollback);
  // A local completion snapshot can remove the session before the server accepts the final answer.
  const retainedSession =
    savingSession?.deckId === deckId && savingSession.remote.uid === uid ? savingSession : undefined;
  const session = awaitingRollback ? (retainedSession ?? remoteSession) : (remoteSession ?? retainedSession);
  const remoteLoading = useRemoteStudySessionsLoading();
  const sessionState =
    session === undefined && remoteLoading ? { status: "preparing" as const } : resolveStudySession(session, cards);
  const controls = {
    swipeActions: preferences.controls,
    showViewMode: preferences.controls.showViewMode,
    showHelp: preferences.controls.showHelp,
    viewMode: preferences.controls.viewMode,
    playbackControlsAvailable: preferences.study.cardInterval > 0,
    showCardDetails: preferences.controls.showCardDetails,
    showPlaybackControls: preferences.controls.showPlaybackControls,
    showSwipeButtonList: preferences.controls.showSwipeButtonList,
    showBackTextSwipeOverlays: preferences.controls.showBackTextSwipeOverlays,
    showSkip: preferences.controls.showSkip,
    helpRows: buildCardPlayerHelpRows(preferences),
  };
  const query = {
    savingSnapshot,
    awaitingRollback,
    sessionId: remoteSession?.sessionId,
    cards,
    preferences,
    sessionState,
    ...controls,
  };
  if (deck == null || sessionState.status !== "studying")
    return {
      ...query,
      status: sessionState.status === "preparing" && deck != null ? ("preparing" as const) : ("invalid" as const),
    };
  const category = getCategory(deck.category, sessionState.card.tags);
  return {
    ...query,
    status: "studying" as const,
    session: { currentIndex: sessionState.session.currentIndex, cardCount: sessionState.session.cardOrderIds.length },
    card: {
      id: sessionState.card.id,
      frontText: sessionState.card.frontText,
      fsrs: sessionState.card.fsrs,
      category,
      back: {
        text: sessionState.card.backText,
        category,
        code: isHighlightLanguage(category),
        dark: preferences.appearance.darkMode,
      },
    },
  };
};
