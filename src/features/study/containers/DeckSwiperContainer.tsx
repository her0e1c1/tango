import * as React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import * as action from "@src/action";
import * as C from "@src/constant";
import * as selector from "@src/selector";
import * as util from "@src/util";
import { BackText } from "@src/features/card/components/BackText";
import { CardOverlay } from "@src/features/card/components/CardOverlay";
import { FrontText } from "@src/features/card/components/FrontText";
import { useDeckActions } from "@src/features/deck/containers/useDeckActions";
import { DeckSwiperTemplate } from "@src/features/study/components/templates/DeckSwiperTemplate";
import type { SwipeButtonListProps } from "@src/features/study/components/SwipeButtonList";
import { useStudyControllerState } from "@src/features/study/containers/useStudyControllerState";
import { useActions } from "@src/shared/hooks/useActions";

export const DeckSwiperContainer: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");

  const deck = useSelector(selector.deck.getById(deckId));
  const card = useSelector(selector.card.getCurrentByDeckId(deckId));
  const config = useSelector(selector.config.get());
  const deckActions = useDeckActions(deckId);
  const actions = useActions();

  useKey("ArrowUp", deckActions.swipeUp);
  useKey("ArrowDown", deckActions.swipeDown);
  useKey("ArrowLeft", deckActions.swipeLeft);
  useKey("ArrowRight", deckActions.swipeRight);
  useKey("Enter", actions.toggleShowBackText);
  useKey("h", actions.toggleShowHeader);
  useKey("b", actions.toggleShowSwipeButtonList);
  useKey(" ", actions.toggleAutoPlay);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const index = deck.currentIndex ?? 0;
  const valid = (index >= 0 && index < deck.cardOrderIds.length) || Boolean(card);
  const controller = useStudyControllerState({
    autoPlay: config.autoPlay,
    cardInterval: config.cardInterval,
    enabled: card != null && config.cardInterval > 0,
    index,
    numberOfCards: deck.cardOrderIds.length,
    onChange: deckActions.updateIndex,
  });

  React.useEffect(() => {
    if (!valid) {
      dispatch(action.deck.update({ id: deckId, currentIndex: null }));
      navigate("/", { replace: true });
    }
  }, [valid, deckId, navigate, dispatch]);

  // disable browser back
  React.useEffect(() => {
    window.history.pushState(null, document.title, document.location.href);
    const f = () => {
      navigate(1);
    };
    window.addEventListener("popstate", f);
    return () => {
      window.removeEventListener("popstate", f);
    };
  }, [navigate]);

  if (card == null) {
    return <></>;
  }

  const category = util.getCategory(deck.category, card.tags);
  const swipeActions: SwipeButtonListProps = {
    onClickUp: deckActions.swipeUp,
    onClickDown: deckActions.swipeDown,
    onClickLeft: deckActions.swipeLeft,
    onClickRight: deckActions.swipeRight,
  };

  return (
    <DeckSwiperTemplate
      showController={config.cardInterval > 0}
      showBackText={config.showBackText}
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
          category={category}
          text={card.frontText}
          onSwipeUp={deckActions.swipeUp}
          onSwipeDown={deckActions.swipeDown}
          onSwipeLeft={deckActions.swipeLeft}
          onSwipeRight={deckActions.swipeRight}
          onClick={actions.toggleShowBackText}
        />
      }
      cardOverlaySlot={<CardOverlay card={card} />}
      backTextSlot={
        <BackText
          category={category}
          code={C.LANGUAGES.includes(category)}
          text={card.backText}
          onClick={actions.toggleShowBackText}
        />
      }
      controller={controller}
      swipeButtonList={swipeActions}
      swipeOverlay={swipeActions}
    />
  );
};
