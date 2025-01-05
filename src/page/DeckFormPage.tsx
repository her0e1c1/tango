import React from "react";
import * as C from "src/constant";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { useParams } from "react-router-dom";
import { DeckForm } from "src/component/Template";
import { useDeckActions, useActions } from "./hooks";

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw Error("invalid deck id");
  const deck = useSelector(selector.deck.getById(deckId));
  const deckActions = useDeckActions(deckId);
  const actions = useActions();
  const config = useSelector(selector.config.get());
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((c) => ({ label: c, value: c })), []);
  return (
    <DeckForm
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      deckForm={{ deck, categoryOptions, onSubmit: deckActions.updateAndBack }}
    />
  );
};
