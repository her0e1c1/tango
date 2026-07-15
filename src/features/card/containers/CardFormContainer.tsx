import * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import * as C from "@src/constant";
import * as selector from "@src/selector";
import { useActions } from "@src/shared/hooks/useActions";
import { CardFormTemplate } from "@src/features/card/components/templates/CardFormTemplate";
import { useCardFormState } from "@src/features/card/hooks/useCardFormState";

export const CardFormContainer: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");

  const card = useSelector(selector.card.getById(cardId));
  const config = useSelector(selector.config.get());
  const actions = useActions();
  const categoryOptions = React.useMemo(() => C.CATEGORY.map((category) => ({ label: category, value: category })), []);
  const cardForm = useCardFormState({ card, categoryOptions, onSubmit: actions.cardUpdateAndBack });

  return (
    <CardFormTemplate
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickMenuItem: actions.goByMenu,
        },
      }}
      cardForm={cardForm}
    />
  );
};
