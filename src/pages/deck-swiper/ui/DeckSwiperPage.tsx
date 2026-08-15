import { getCategory, isHighlightLanguage, type Deck, type DeckId, useDeck } from "@/entities/deck";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, type CardId, useCards } from "@/entities/card";
import { BackText, CardOverlay, FrontText } from "@/features/card-view";
import {
  initializeStudySessionUi,
  selectStudySessionForRoute,
  type SwipeButtonListProps,
  touchStudySession,
  useEditStudyProgress,
  useStudyActions,
  useStudyControllerState,
  useStudyHydrated,
  useStudyStore,
} from "@/features/study";
import { toggleShowHeader, toggleShowSwipeButtonList, usePreferences } from "@/entities/preferences";
import { toRemoteById } from "@/shared/api";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const SWIPE_FEEDBACK_DURATION_MS = 900;
const isHistoryState = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const DeckSwiperContent = ({ cardsById, deck }: { cardsById: Partial<Record<CardId, Card>>; deck: Deck }) => {
  const navigate = useNavigate();
  const deckId = deck.id;
  const preferences = usePreferences();
  const allCards = useCards();
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const lastSwipe = useStudyStore((state) => state.lastSwipe);
  const clearLastSwipe = useStudyStore((state) => state.clearLastSwipe);
  const hydrated = useStudyHydrated();

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cardsById[cardId];
  const cardMutation = useEditStudyProgress();
  const studyActions = useStudyActions(deckId, {
    cardsById,
    cardMutation: {
      update: cardMutation.update,
    },
  });
  useKey("ArrowUp", studyActions.swipeUp);
  useKey("ArrowDown", studyActions.swipeDown);
  useKey("ArrowLeft", studyActions.swipeLeft);
  useKey("ArrowRight", studyActions.swipeRight);
  useKey("Enter", studyActions.toggleShowBackText);
  useKey("h", toggleShowHeader);
  useKey("b", toggleShowSwipeButtonList);
  useKey(" ", studyActions.toggleAutoPlay);

  React.useEffect(() => {
    if (!preferences.appearance.showSwipeFeedback) {
      if (lastSwipe !== undefined) clearLastSwipe();
      return;
    }
    if (lastSwipe === undefined) return;

    const timeout = window.setTimeout(clearLastSwipe, SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [clearLastSwipe, preferences.appearance.showSwipeFeedback, lastSwipe]);

  const valid = session != null && index >= 0 && index < session.cardOrderIds.length && card != null;
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;
  const isWaitingForCards = sessionHasTargetCard && card == null && allCards.length === 0;

  const controller = useStudyControllerState({
    autoPlay,
    cardInterval: preferences.study.cardInterval,
    enabled: card != null && preferences.study.cardInterval > 0,
    index,
    numberOfCards: session?.cardOrderIds.length ?? 0,
    onChange: studyActions.updateIndex,
    onToggleAutoPlay: studyActions.toggleAutoPlay,
  });

  const exitingDeck = React.useRef<DeckId>(undefined);
  React.useEffect(() => {
    if (!valid) return;
    initializeStudySessionUi(preferences.study.defaultAutoPlay);
    touchStudySession(deckId);
  }, [preferences.study.defaultAutoPlay, deckId, valid]);

  React.useEffect(() => {
    if (valid) {
      exitingDeck.current = undefined;
      return;
    }
    if (!hydrated || isWaitingForCards || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    studyActions.resetStudy();
    void navigate("/", { replace: true });
  }, [deckId, hydrated, isWaitingForCards, navigate, studyActions, valid]);

  // Keep the active study session on the route when browser history moves backward.
  React.useEffect(() => {
    const currentState: unknown = window.history.state;
    const state = isHistoryState(currentState) ? currentState : {};
    if (state[STUDY_HISTORY_GUARD] !== deckId) {
      window.history.pushState({ ...state, [STUDY_HISTORY_GUARD]: deckId }, document.title, document.location.href);
    }
    const handlePopState = () => {
      void navigate(1);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [deckId, navigate]);

  if (card == null) {
    if (isWaitingForCards) {
      return <RouteFeedback title="Loading…" tone="loading" />;
    }
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  const category = getCategory(deck.category, card.tags);
  const swipeActions: SwipeButtonListProps = {
    disabled: false,
    onClickUp: studyActions.swipeUp,
    onClickDown: studyActions.swipeDown,
    onClickLeft: studyActions.swipeLeft,
    onClickRight: studyActions.swipeRight,
  };

  return (
    <AppLayout fullscreen scroll={showBackText} showHeader={preferences.appearance.showHeader && !showBackText}>
      <DeckSwiperView
        showController={preferences.study.cardInterval > 0}
        showBackText={showBackText}
        showSwipeButtonList={preferences.controls.showSwipeButtonList}
        {...(preferences.appearance.showSwipeFeedback && lastSwipe !== undefined
          ? { swipeFeedback: lastSwipe.direction }
          : {})}
        frontTextSlot={
          <FrontText
            category={category}
            text={card.frontText}
            onSwipeUp={studyActions.swipeUp}
            onSwipeDown={studyActions.swipeDown}
            onSwipeLeft={studyActions.swipeLeft}
            onSwipeRight={studyActions.swipeRight}
            onClick={studyActions.toggleShowBackText}
          />
        }
        cardOverlaySlot={<CardOverlay card={card} />}
        backTextSlot={
          <BackText
            category={category}
            code={isHighlightLanguage(category)}
            dark={preferences.appearance.darkMode}
            text={card.backText}
            onClick={studyActions.toggleShowBackText}
          />
        }
        controller={controller}
        swipeButtonList={swipeActions}
        swipeOverlay={swipeActions}
      />
    </AppLayout>
  );
};

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const cards = useCards();
  const cardsById = React.useMemo(() => toRemoteById(cards), [cards]);
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <DeckSwiperContent cardsById={cardsById} deck={deck} />;
};
