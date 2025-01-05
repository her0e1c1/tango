import React from "react";
import { useKey } from "react-use";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { CardList } from "src/component/Template";
import { useActions, useDeckActions } from "./hooks";
import { useParams } from "react-router-dom";

export const CardListPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const actions = useActions();
  const deckActions = useDeckActions(deckId);
  const deck = useSelector(selector.deck.getById(deckId));
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const tags = useSelector(selector.card.getAllTags(deckId));
  const config = useSelector(selector.config.get());
  useKey("t", actions.goToTop);
  useKey("s", actions.goToSettings);
  return (
    <CardList
      deck={deck}
      cards={cards}
      tags={tags}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      card={{
        onSwipedLeft: actions.cardUpdateBy((c) => ({ score: c.score - 1 })),
        onSwipedRight: actions.cardUpdateBy((c) => ({ score: c.score + 1 })),
        goToEdit: actions.goToCardEdit,
        onDelete: actions.cardRemove,
      }}
      onSubmit={deckActions.update}
    />
  );
};
