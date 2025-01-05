import { useKey } from "react-use";
import React from "react";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { useParams } from "react-router-dom";
import { DeckStart } from "src/component/Template";
import { useDeckActions, useActions } from "./hooks";

export const DeckStartPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deckId");
  const deck = useSelector(selector.deck.getById(deckId));
  const cards = useSelector(selector.card.getFilteredByDeckId(deckId));
  const config = useSelector(selector.config.get());
  const tags = useSelector(selector.card.getAllTags(deckId));
  const deckActions = useDeckActions(deckId);
  const actions = useActions();
  useKey("Enter", deckActions.start);
  return (
    <DeckStart
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      config={config}
      cardsLength={cards.length}
      onClickStart={deckActions.start}
      deckStartForm={{
        deck,
        tags,
        onSubmit: deckActions.update,
      }}
    />
  );
};
