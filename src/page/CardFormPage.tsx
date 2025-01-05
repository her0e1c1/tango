import React from "react";
import * as C from "src/constant";
import { useSelector } from "react-redux";
import * as selector from "src/selector";
import { useParams } from "react-router-dom";
import { CardForm } from "src/component/Template";
import { useActions } from "./hooks";

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const card = useSelector(selector.card.getById(cardId));
  const config = useSelector(selector.config.get());
  const actions = useActions();
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((c) => ({ label: c, value: c })), []);
  return (
    <CardForm
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      cardForm={{ card, categoryOptions, onSubmit: actions.cardUpdateAndBack }}
    />
  );
};
