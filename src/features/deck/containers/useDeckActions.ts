import * as React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as action from "@src/action";

export const useDeckActions = (id: DeckId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      swipeUp: () => {
        dispatch(action.deck.swipe("cardSwipeUp", id));
      },
      swipeDown: () => {
        dispatch(action.deck.swipe("cardSwipeDown", id));
      },
      swipeLeft: () => {
        dispatch(action.deck.swipe("cardSwipeLeft", id));
      },
      swipeRight: () => {
        dispatch(action.deck.swipe("cardSwipeRight", id));
      },
      update: (deck: Deck) => {
        dispatch(action.deck.update(deck));
      },
      updateAndBack: (deck: Deck) => {
        dispatch(action.deck.update(deck));
        navigate(-1);
      },
      remove: () => dispatch(action.deck.remove(id)),
      start: async () => {
        await dispatch(action.deck.start(id));
        await navigate(`/deck/${id}/study`, { replace: true });
      },
      updateIndex: (currentIndex: number) => {
        dispatch(action.config.update("showBackText", false));
        dispatch(action.deck.update({ id, currentIndex }));
      },
    }),
    [dispatch, navigate, id]
  );
};
