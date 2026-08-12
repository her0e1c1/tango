import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import { type Card, useCards } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck, useDecks } from "@/entities/deck";
import { setDarkMode, useConfig } from "@/shared/config";
import { combineRemoteReadStates } from "@/shared/lib/remote-read/combineRemoteReadStates";
import { Layout } from "@/shared/ui/layout";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";

import { CardViewView } from "./CardViewView";

const CardViewContent = ({ card, deck }: { card: Card; deck: Deck }) => {
  const navigate = useNavigate();
  const config = useConfig();
  const category = getCategory(deck.category, card.tags);

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
          category,
          code: isHighlightLanguage(category),
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
  const remote = useCards();
  const deckRemote = useDecks();
  const readState = combineRemoteReadStates(remote, deckRemote);
  const card = remote.cardsById[cardId];
  const deck = card == null ? undefined : deckRemote.decksById[card.deckId];
  const available = card != null && deck != null;

  return (
    <RemoteReadBoundary
      status={readState.status}
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
      onRetry={readState.retry}
    >
      {available ? <CardViewContent card={card} deck={deck} /> : null}
    </RemoteReadBoundary>
  );
};
