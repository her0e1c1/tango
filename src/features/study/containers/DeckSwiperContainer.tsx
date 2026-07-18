import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@/constant";
import * as util from "@/util";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteMutationNotice, RemoteReadBoundary } from "@/components";
import { BackText } from "@/features/card/components/BackText";
import { CardOverlay } from "@/features/card/components/CardOverlay";
import { FrontText } from "@/features/card/components/FrontText";
import { DeckSwiperTemplate } from "@/features/study/components/templates/DeckSwiperTemplate";
import type { SwipeButtonListProps } from "@/features/study/components/SwipeButtonList";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useStudyControllerState } from "@/features/study/hooks/useStudyControllerState";
import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";
import { selectStudySessionForRoute, studyStore } from "@/features/study/state/studyStore";
import { useActions } from "@/hooks/useActions";
import { useConfig } from "@/hooks/useConfig";

const STUDY_HISTORY_GUARD = "tangoStudyDeckId";

export const DeckSwiperContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const config = useConfig();
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const session = useStudyStore(selectStudySessionForRoute(deckId));
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const hydrated = useStudyHydrated();

  const index = session?.currentIndex ?? -1;
  const cardId = index >= 0 ? session?.cardOrderIds[index] : undefined;
  const card = cardId == null ? undefined : remote.cardById(cardId);
  const studyActions = useStudyActions(deckId);
  const actions = useActions();

  useKey("ArrowUp", studyActions.swipeUp);
  useKey("ArrowDown", studyActions.swipeDown);
  useKey("ArrowLeft", studyActions.swipeLeft);
  useKey("ArrowRight", studyActions.swipeRight);
  useKey("Enter", studyActions.toggleShowBackText);
  useKey("h", actions.toggleShowHeader);
  useKey("b", actions.toggleShowSwipeButtonList);
  useKey(" ", studyActions.toggleAutoPlay);

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

  // disable browser back
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

  const category = util.getCategory(deck.category, card.tags);
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
    <DeckSwiperTemplate
      showController={config.cardInterval > 0}
      showBackText={showBackText}
      showHeader={config.showHeader}
      showSwipeButtonList={config.showSwipeButtonList}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
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
          {...(category !== undefined ? { category } : {})}
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
          {...(category !== undefined ? { category } : {})}
          code={category !== undefined && C.LANGUAGES.includes(category)}
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
