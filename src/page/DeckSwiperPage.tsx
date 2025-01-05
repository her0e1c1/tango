import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DeckSwiper } from "src/component/Template";
import { useDeckActions, useActions } from "./hooks";
import * as selector from "src/selector";
import { useSelector, useDispatch } from "react-redux";
import { useKey } from "react-use";
import * as action from "src/action";
import * as util from "src/util";

export const DeckSwiperPage: React.FC = () => {
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
  return (
    <DeckSwiper
      card={card}
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
      frontText={{
        category,
        text: card.frontText,
        onSwipeUp: deckActions.swipeUp,
        onSwipeDown: deckActions.swipeDown,
        onSwipeLeft: deckActions.swipeLeft,
        onSwipeRight: deckActions.swipeRight,
        onClick: actions.toggleShowBackText,
      }}
      backText={{
        category,
        text: card.backText,
        onClick: actions.toggleShowBackText,
      }}
      controller={{
        autoPlay: config.autoPlay,
        cardInterval: config.cardInterval,
        index: deck.currentIndex ?? 0,
        numberOfCards: deck.cardOrderIds.length,
        onChange: deckActions.updateIndex,
      }}
      swipeButtonList={{
        onClickUp: deckActions.swipeUp,
        onClickDown: deckActions.swipeDown,
        onClickLeft: deckActions.swipeLeft,
        onClickRight: deckActions.swipeRight,
      }}
    />
  );
};
