import React from "react";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { CardView } from "src/component/Template";
import { useParams } from "react-router-dom";
import { useActions } from "./hooks";
import * as util from "src/util";

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const card = useSelector(selector.card.getById(cardId));
  const actions = useActions();
  const deck = useSelector(selector.deck.getById(card.deckId));
  const config = useSelector(selector.config.get());
  const category = util.getCategory(deck.category, card.tags);
  return (
    <CardView
      backText={{
        category,
        text: card.backText,
        onClick: actions.toggleShowBackText,
      }}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
    />
  );
};
