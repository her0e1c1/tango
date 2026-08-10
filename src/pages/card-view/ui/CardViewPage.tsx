import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { useActions } from "@/features/app-controls";
import { useConfig } from "@/entities/config";
import { useRemoteCollections } from "@/features/remote-collections";
import { getContentCategory, LANGUAGES } from "@/shared/lib/content-category";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { CardViewView } from "./CardViewView";

const CardViewContent = ({ card, deck }: { card: Card; deck: Deck }) => {
  const actions = useActions();
  const config = useConfig();
  const category = getContentCategory(deck.category, card.tags);

  return (
    <CardViewView
      backText={{
        category,
        code: LANGUAGES.includes(category),
        dark: config.darkMode,
        text: card.backText,
      }}
      layout={{
        headerProps: {
          dark: config.darkMode,
          onClickDarkMode: actions.setDarkMode,
          onClickLogo: actions.goToTop,
          onClickImport: actions.goToImport,
          onClickSettings: actions.goToSettings,
        },
      }}
    />
  );
};

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useRemoteCollections();
  const card = remote.cardById(cardId);
  const deck = card == null ? undefined : remote.deckById(card.deckId);
  const available = card != null && deck != null;

  return (
    <RemoteReadBoundary
      status={remote.status}
      hasData={available}
      emptyContent={
        <RouteFeedback
          title="Card not found"
          description="The requested card is unavailable or has been removed."
          tone="not-found"
          primaryAction={{ label: "Go home", onClick: () => void navigate("/") }}
          secondaryAction={{ label: "Go back", onClick: () => void navigate(-1) }}
        />
      }
      onRetry={remote.retry}
    >
      {available ? <CardViewContent card={card} deck={deck} /> : null}
    </RemoteReadBoundary>
  );
};
