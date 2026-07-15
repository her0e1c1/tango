import * as React from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import * as action from "@/action";

export const useDeckActions = (id: DeckId) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  return React.useMemo(
    () => ({
      update: (deck: Deck) => {
        dispatch(action.deck.update(deck));
      },
      updateAndBack: (deck: Deck) => {
        dispatch(action.deck.update(deck));
        navigate(-1);
      },
      remove: () => dispatch(action.deck.remove(id)),
    }),
    [dispatch, navigate, id]
  );
};
