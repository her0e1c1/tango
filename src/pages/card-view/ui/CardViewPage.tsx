import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import * as C from "@/constant";
import { type Card, useCard } from "@/entities/card";
import { type Deck, useDeck } from "@/entities/deck";
import { setDarkMode, useConfig } from "@/shared/config";
import { Layout } from "@/shared/ui/layout";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import * as util from "@/util";

import { CardViewView } from "./CardViewView";

const CardViewContent = ({ card, deck }: { card: Card; deck: Deck }) => {
  const navigate = useNavigate();
  const config = useConfig();
  const category = util.getCategory(deck.category, card.tags);

  return (
    <Layout
      showHeader
      headerProps={{
        dark: config.appearance.darkMode,
        onClickDarkMode: setDarkMode,
        onClickLogo: () => void navigate("/"),
        onClickImport: () => void navigate("/import"),
        onClickSettings: () => void navigate("/settings"),
      }}
    >
      <CardViewView
        backText={{
          ...(category !== undefined ? { category } : {}),
          code: category !== undefined && C.LANGUAGES.includes(category),
          dark: config.appearance.darkMode,
          text: card.backText,
        }}
      />
    </Layout>
  );
};

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useCard(cardId);
  const card = remote.card;
  const deck = useDeck(card?.deckId ?? "").deck;
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
