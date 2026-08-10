import type { DeckId } from "@/entities/deck";
import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { BackText, CardOverlay, FrontText, useCardMutations } from "@/features/card";
import {
  selectStudySessionForRoute,
  filterCardsForDeck,
  studyStore,
  type SwipeButtonListProps,
  useStudyActions,
  useStudyControllerState,
  useStudyHydrated,
  useStudyStore,
} from "@/features/study";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { useRemoteCollections } from "@/features/remote-collections";
import { getContentCategory, LANGUAGES } from "@/shared/lib/content-category";
import { RemoteMutationNotice } from "@/shared/ui/remote-mutation-notice";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";

import { DeckSwiperView } from "./DeckSwiperView";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";
const SWIPE_FEEDBACK_DURATION_MS = 900;

export const DeckSwiperPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const config = useConfig();
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const lastSwipe = useStudyStore((state) => state.lastSwipe);
  const clearLastSwipe = useStudyStore((state) => state.clearLastSwipe);
  const hydrated = useStudyHydrated();

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : remote.cardById(cardId);
  const filteredCards = deck == null ? [] : filterCardsForDeck(remote.cardsByDeckId(deckId), deck, config, remote.now);
  const cardMutations = useCardMutations({ cardById: remote.cardById });
  const studyActions = useStudyActions({
    deckId,
    config,
    cards: filteredCards,
    cardsById: remote.cardsById,
    cardMutations,
  });
  const actions = useActions();

  useKey("ArrowUp", studyActions.swipeUp);
  useKey("ArrowDown", studyActions.swipeDown);
  useKey("ArrowLeft", studyActions.swipeLeft);
  useKey("ArrowRight", studyActions.swipeRight);
  useKey("Enter", studyActions.toggleShowBackText);
  useKey("h", actions.toggleShowHeader);
  useKey("b", actions.toggleShowSwipeButtonList);
  useKey(" ", studyActions.toggleAutoPlay);

  React.useEffect(() => {
    if (!config.showSwipeFeedback) {
      if (lastSwipe !== undefined) clearLastSwipe();
      return;
    }
    if (lastSwipe === undefined) return;

    const timeout = window.setTimeout(clearLastSwipe, SWIPE_FEEDBACK_DURATION_MS);
    return () => window.clearTimeout(timeout);
  }, [clearLastSwipe, config.showSwipeFeedback, lastSwipe]);

  const navigate = useNavigate();
  const valid = session != null && index >= 0 && index < session.cardOrderIds.length && card != null;
  const controller = useStudyControllerState({
    autoPlay,
    cardInterval: config.cardInterval,
    enabled: card != null && config.cardInterval > 0,
    index,
    numberOfCards: session?.cardOrderIds.length ?? 0,
    onChange: studyActions.updateIndex,
    onToggleAutoPlay: studyActions.toggleAutoPlay,
  });

  const exitingDeck = React.useRef<DeckId>(undefined);
  React.useEffect(() => {
    if (!valid) return;
    const state = studyStore.getState();
    state.initializeStudyUi(config.defaultAutoPlay);
    state.touchStudy(deckId);
  }, [config.defaultAutoPlay, deckId, valid]);

  React.useEffect(() => {
    if (valid) {
      exitingDeck.current = undefined;
      return;
    }
    if (!hydrated || remote.status !== "ready" || exitingDeck.current === deckId) return;

    exitingDeck.current = deckId;
    studyActions.resetStudy();
    void navigate("/", { replace: true });
  }, [deckId, hydrated, navigate, remote.status, studyActions, valid]);

  // Keep the active study session on the route when browser history moves backward.
  React.useEffect(() => {
    const currentState = window.history.state;
    const state = typeof currentState === "object" && currentState != null ? currentState : {};
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
        status={remote.status}
        hasData={false}
        emptyLabel="Study session unavailable."
        onRetry={remote.retry}
      >
        {null}
      </RemoteReadBoundary>
    );
  }

  const category = getContentCategory(deck.category, card.tags);
  const swipeActions: SwipeButtonListProps = {
    disabled: studyActions.pending,
    ...(studyActions.pending
      ? {}
      : {
          onClickUp: studyActions.swipeUp,
          onClickDown: studyActions.swipeDown,
          onClickLeft: studyActions.swipeLeft,
          onClickRight: studyActions.swipeRight,
        }),
  };

  return (
    <DeckSwiperView
      showController={config.cardInterval > 0}
      showBackText={showBackText}
      showHeader={config.showHeader}
      showSwipeButtonList={config.showSwipeButtonList}
      {...(config.showSwipeFeedback && lastSwipe !== undefined ? { swipeFeedback: lastSwipe.direction } : {})}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
      feedbackSlot={
        <RemoteMutationNotice
          pending={studyActions.pending}
          error={studyActions.error}
          onRetry={studyActions.retry}
          showPending={false}
        />
      }
      frontTextSlot={
        <FrontText
          category={category}
          text={card.frontText}
          {...(!studyActions.pending
            ? {
                onSwipeUp: studyActions.swipeUp,
                onSwipeDown: studyActions.swipeDown,
                onSwipeLeft: studyActions.swipeLeft,
                onSwipeRight: studyActions.swipeRight,
              }
            : {})}
          onClick={studyActions.toggleShowBackText}
        />
      }
      cardOverlaySlot={<CardOverlay card={card} />}
      backTextSlot={
        <BackText
          category={category}
          code={LANGUAGES.includes(category)}
          dark={config.darkMode}
          text={card.backText}
          onClick={studyActions.toggleShowBackText}
        />
      }
      controller={controller}
      swipeButtonList={swipeActions}
      swipeOverlay={swipeActions}
    />
  );
};
