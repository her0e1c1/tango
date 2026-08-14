import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";

import type { Card } from "@/entities/card";
import { getCategory, isHighlightLanguage, type Deck, useDeck } from "@/entities/deck";
import { useCards } from "@/features/card/read";
import { useConfig } from "@/shared/config";
import { RemoteReadBoundary } from "@/shared/ui/remote-read-boundary";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

import { CardViewView } from "./CardViewView";

const CardViewContent = ({ card, deck }: { card: Card; deck: Deck }) => {
  const config = useConfig();
  const category = getCategory(deck.category, card.tags);

  return (
    <AppLayout showHeader>
      <CardViewView
        backText={{
          category,
          code: isHighlightLanguage(category),
          dark: config.appearance.darkMode,
          text: card.backText,
        }}
      />
    </AppLayout>
  );
};

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const cardId = params.id;
  if (cardId == null) throw Error("invalid card id");
  const remote = useCards();
  const card = remote.cardsById[cardId];
  const deck = useDeck(card?.deckId);
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
