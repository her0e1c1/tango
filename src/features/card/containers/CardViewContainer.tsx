import type * as React from "react";
import { useParams } from "react-router-dom";

import * as C from "@/constant";
import * as util from "@/util";
import { useRemoteCollections } from "@/query/useRemoteCollections";
import { RemoteReadBoundary } from "@/components";
import { useActions } from "@/hooks/useActions";
import { CardViewTemplate } from "@/features/card/components/templates/CardViewTemplate";
import { useConfig } from "@/features/settings/hooks/useConfig";

const CardViewContent = ({ card, deck }: { card: Card; deck: Deck }) => {
  const actions = useActions();
  const config = useConfig();
  const category = util.getCategory(deck.category, card.tags);

  return (
    <CardViewTemplate
      backText={{
        ...(category !== undefined ? { category } : {}),
        code: category !== undefined && C.LANGUAGES.includes(category),
        dark: config.darkMode,
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

export const CardViewContainer: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useRemoteCollections();
  const card = remote.cardById(cardId);
  const deck = card == null ? undefined : remote.deckById(card.deckId);
  const available = card != null && deck != null;

  return (
    <RemoteReadBoundary status={remote.status} hasData={available} emptyLabel="Card not found." onRetry={remote.retry}>
      {available ? <CardViewContent card={card} deck={deck} /> : null}
    </RemoteReadBoundary>
  );
};
