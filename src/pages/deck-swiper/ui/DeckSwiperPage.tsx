import { getCategory, isHighlightLanguage, type DeckId, useDecks } from "@/entities/deck";

import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { useCards } from "@/entities/card";
import { useEditCard } from "@/features/card/edit";
import { BackText, CardOverlay, FrontText } from "@/features/card/view";
import {
  initializeStudySessionUi,
  selectStudySessionForRoute,
  type SwipeButtonListProps,
  touchStudySession,
  useStudyActions,
  useStudyControllerState,
  useStudyHydrated,
  useStudyStore,
} from "@/features/study";
import { toggleShowHeader, toggleShowSwipeButtonList, useConfig } from "@/shared/config";
import { combineRemoteReadStates } from "@/shared/lib/remote-read";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { AppLayout } from "@/widgets/app-layout";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const SWIPE_FEEDBACK_DURATION_MS = 900;
const isHistoryState = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value != null && !Array.isArray(value);

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const config = useConfig();
  const remote = useDecks();
  const cardRemote = useCards();
  const readState = combineRemoteReadStates(cardRemote, remote);
  const deck = remote.decksById[deckId];
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const lastSwipe = useStudyStore((state) => state.lastSwipe);
  const clearLastSwipe = useStudyStore((state) => state.clearLastSwipe);
  const hydrated = useStudyHydrated();

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : cardRemote.cardsById[cardId];
  const cardMutation = useEditCard();
  const studyActions = useStudyActions(deckId, {
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
    if (!config.appearance.showSwipeFeedback) {
      if (lastSwipe !== undefined) clearLastSwipe();
      return;
    }
    if (lastSwipe === undefined) return;

    const timeout = window.setTimeout(clearLastSwipe, SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [clearLastSwipe, config.appearance.showSwipeFeedback, lastSwipe]);

  const valid = session != null && index >= 0 && index < session.cardOrderIds.length && card != null;
  const controller = useStudyControllerState({
    autoPlay,
    cardInterval: config.study.cardInterval,
    enabled: card != null && config.study.cardInterval > 0,
    index,
    numberOfCards: session?.cardOrderIds.length ?? 0,
    onChange: studyActions.updateIndex,
    onToggleAutoPlay: studyActions.toggleAutoPlay,
  });

  const exitingDeck = React.useRef<DeckId>(undefined);
  React.useEffect(() => {
    if (!valid) return;
    initializeStudySessionUi(config.study.defaultAutoPlay);
    touchStudySession(deckId);
  }, [config.study.defaultAutoPlay, deckId, valid]);

  React.useEffect(() => {
    if (valid) {
      exitingDeck.current = undefined;
      return;
    }
    if (!hydrated || readState.status !== "ready" || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    studyActions.resetStudy();
    void navigate("/", { replace: true });
  }, [deckId, hydrated, navigate, readState.status, studyActions, valid]);

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

  if (card == null || deck == null) {
    return (
      <RemoteReadBoundary
        status={readState.status}
        hasData={false}
        emptyLabel="Study session unavailable."
        onRetry={readState.retry}
      >
        {null}
      </RemoteReadBoundary>
    );
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
    <AppLayout fullscreen scroll={showBackText} showHeader={config.appearance.showHeader && !showBackText}>
      <DeckSwiperView
        showController={config.study.cardInterval > 0}
        showBackText={showBackText}
        showSwipeButtonList={config.controls.showSwipeButtonList}
        {...(config.appearance.showSwipeFeedback && lastSwipe !== undefined
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
            dark={config.appearance.darkMode}
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
