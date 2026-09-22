import { useCards, type Card } from "@/entities/card";
import { getCategory, isHighlightLanguage, useDeck } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { resolveStudySession, useStudySession, useRemoteStudySessionsLoading } from "@/entities/study-session";
import { buildCardPlayerHelpRows } from "@/features/card-player";

export type StudySessionState = ReturnType<typeof resolveStudySession<Card>>;

export const useStudyQuery = (deckId: string) => {
  const cards = useCards();
  const deck = useDeck(deckId);
  const preferences = usePreferences();
  const session = useStudySession(deckId);
  const remoteLoading = useRemoteStudySessionsLoading();
  const sessionState: StudySessionState =
    session === undefined && remoteLoading ? { status: "preparing" } : resolveStudySession(session, cards);
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
  const query = { sessionId: session?.sessionId, cards, preferences, sessionState, ...controls };
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
      category,
      difficulty: sessionState.card.difficulty,
      numberOfSeen: sessionState.card.numberOfSeen,
      ...(sessionState.card.lastSeenAt !== undefined ? { lastSeenAt: sessionState.card.lastSeenAt } : {}),
      back: {
        text: sessionState.card.backText,
        category,
        code: isHighlightLanguage(category),
        dark: preferences.appearance.darkMode,
      },
    },
  };
};
