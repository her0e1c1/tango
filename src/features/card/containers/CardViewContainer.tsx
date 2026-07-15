import type * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import * as C from "@/constant";
import * as selector from "@/selector";
import * as util from "@/util";
import { useActions } from "@/shared/hooks/useActions";
import { CardViewTemplate } from "@/features/card/components/templates/CardViewTemplate";

export const CardViewContainer: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");

  const card = useSelector(selector.card.getById(cardId));
  const actions = useActions();
  const deck = useSelector(selector.deck.getById(card.deckId));
  const config = useSelector(selector.config.get());
  const category = util.getCategory(deck.category, card.tags);

  return (
    <CardViewTemplate
      backText={{
        ...(category !== undefined ? { category } : {}),
        code: category !== undefined && C.LANGUAGES.includes(category),
        text: card.backText,
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
