import { getCategory, type Deck, type DeckId, useDeck } from "@/entities/deck";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { type Card, useCards } from "@/entities/card";
import { CardOverlay, CardView, FrontText } from "@/features/card-view";
import {
  selectStudySessionForRoute,
  type SwipeButtonListProps,
  touchStudySession,
  useEditStudyProgress,
  useStudyActions,
  useStudyControllerState,
  useStudyHydrated,
  useStudyStore,
} from "@/features/study";
import {
  toggleShowHeader,
  toggleShowSwipeButtonList,
  usePreferences,
  type SwipeDirection,
} from "@/entities/preferences";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const SWIPE_FEEDBACK_DURATION_MS = 900;
const isHistoryState = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

const DeckSwiperContent = ({ cards, deck }: { cards: Card[]; deck: Deck }) => {
  const navigate = useNavigate();
  const deckId = deck.id;
  const preferences = usePreferences();
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const [showBackText, setShowBackText] = React.useState(false);
  const [autoPlay, setAutoPlay] = React.useState(preferences.study.defaultAutoPlay);
  const [lastSwipe, setLastSwipe] = React.useState<{ direction: SwipeDirection; eventId: number } | undefined>(
    undefined
  );
  const nextSwipeEventId = React.useRef(0);
  const hydrated = useStudyHydrated();

  const handleHideBackText = React.useCallback(() => {
    setShowBackText(false);
  }, []);
  const handleToggleBackText = React.useCallback(() => {
    setShowBackText((prev) => !prev);
  }, []);
  const handleRestoreBackText = React.useCallback((show: boolean) => {
    setShowBackText(show);
  }, []);
  const handleToggleAutoPlay = React.useCallback(() => {
    setAutoPlay((prev) => !prev);
  }, []);

  const handleSwipe = React.useCallback(
    (direction: SwipeDirection) => {
      if (!preferences.appearance.showSwipeFeedback) return;
      const eventId = ++nextSwipeEventId.current;
      setLastSwipe({ direction, eventId });
      return () => {
        setLastSwipe((current) => (current?.eventId === eventId ? undefined : current));
      };
    },
    [preferences.appearance.showSwipeFeedback]
  );
  const clearLastSwipe = React.useCallback(() => {
    setLastSwipe(undefined);
  }, []);

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cards.find(({ id }) => id === cardId);
  const cardMutation = useEditStudyProgress();
  const studyActions = useStudyActions(deckId, {
    cards,
    cardMutation: {
      update: cardMutation.update,
    },
    onSwipe: handleSwipe,
    showBackText,
    onHideBackText: handleHideBackText,
    onToggleBackText: handleToggleBackText,
    onRestoreBackText: handleRestoreBackText,
    onToggleAutoPlay: handleToggleAutoPlay,
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
    if (lastSwipe === undefined) return;

    const timeout = window.setTimeout(clearLastSwipe, SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [clearLastSwipe, lastSwipe]);

  const valid = session != null && index >= 0 && index < session.cardOrderIds.length && card != null;
  const sessionHasTargetCard = session != null && index >= 0 && index < session.cardOrderIds.length;
  const isWaitingForCards = sessionHasTargetCard && card == null && cards.length === 0;

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
    touchStudySession(deckId);
  }, [deckId, valid]);

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
        backTextSlot={<CardView card={card} deck={deck} onClick={studyActions.toggleShowBackText} variant="bare" />}
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
  const deck = useDeck(deckId);

  if (deck == null) {
    return <RouteFeedback title="Study session unavailable." tone="not-found" />;
  }

  return <DeckSwiperContent key={deck.id} cards={cards} deck={deck} />;
};
