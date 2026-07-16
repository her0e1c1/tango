import * as React from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as C from "@/constant";
import * as selector from "@/selector";
import * as util from "@/util";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/components";
import { BackText } from "@/features/card/components/BackText";
import { CardOverlay } from "@/features/card/components/CardOverlay";
import { FrontText } from "@/features/card/components/FrontText";
import { DeckSwiperTemplate } from "@/features/study/components/templates/DeckSwiperTemplate";
import type { SwipeButtonListProps } from "@/features/study/components/SwipeButtonList";
import { useStudyActions } from "@/features/study/hooks/useStudyActions";
import { useStudyControllerState } from "@/features/study/hooks/useStudyControllerState";
import { useStudyHydrated } from "@/features/study/hooks/useStudyHydrated";
import { useStudyStore } from "@/features/study/hooks/useStudyStore";
import { useActions } from "@/shared/hooks/useActions";

export const DeckSwiperContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const config = useSelector(selector.config.get());
  const remote = useRemoteCollections();
  const deck = remote.deckById(deckId);
  const activeSession = useStudyStore((state) => state.session);
  const showBackText = useStudyStore((state) => state.showBackText);
  const autoPlay = useStudyStore((state) => state.autoPlay);
  const hydrated = useStudyHydrated();

  const session = activeSession?.deckId === deckId ? activeSession : null;
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

  const exitingDeck = React.useRef<DeckId>();
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
    window.history.pushState(null, document.title, document.location.href);
    const f = () => {
      void navigate(1);
    };
    window.addEventListener("popstate", f);
    return () => {
      window.removeEventListener("popstate", f);
    };
  }, [navigate]);

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
    onClickUp: studyActions.swipeUp,
    onClickDown: studyActions.swipeDown,
    onClickLeft: studyActions.swipeLeft,
    onClickRight: studyActions.swipeRight,
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
      frontTextSlot={
        <FrontText
          {...(category !== undefined ? { category } : {})}
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
          {...(category !== undefined ? { category } : {})}
          code={category !== undefined && C.LANGUAGES.includes(category)}
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
