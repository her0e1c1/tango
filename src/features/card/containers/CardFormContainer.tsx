import * as React from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";

import * as C from "@/constant";
import * as selector from "@/selector";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/shared/components";
import { useActions } from "@/shared/hooks/useActions";
import { CardFormTemplate } from "@/features/card/components/templates/CardFormTemplate";
import { useCardFormState } from "@/features/card/hooks/useCardFormState";

const CardFormContent = ({ card }: { card: Card }) => {
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

export const CardFormContainer: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useRemoteCollections();
  const card = remote.cardById(cardId);

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={card != null}
      emptyLabel="Card not found."
      onRetry={remote.retry}
    >
      {card != null ? <CardFormContent card={card} /> : null}
    </RemoteReadBoundary>
  );
};
