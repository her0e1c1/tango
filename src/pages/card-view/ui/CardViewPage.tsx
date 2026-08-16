import type * as React from "react";
import { useParams } from "react-router-dom";

import { useCard } from "@/entities/card";
import { useDeck } from "@/entities/deck";
import { CardView } from "@/features/card-view";
import { useNavigation } from "@/shared/routes";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);
  const deck = useDeck(card?.deckId);
  const available = card != null && deck != null;

  if (!available) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.goToDeckList() }}
        secondaryAction={{ label: "Go back", onClick: () => void navigation.goBack() }}
      />
    );
  }

  return (
    <AppLayout showHeader>
      <CardView card={card} deck={deck} />
    </AppLayout>
  );
};
