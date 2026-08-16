import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardView, useCardViewState } from "@/features/card-view";
import { routes, useNavigation } from "@/features/navigate";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const cardView = useCardViewState(cardId);

  if (!cardView.available || cardView.content == null) {
    return (
      <RouteFeedback
        title="Card not found"
        description="The requested card is unavailable or has been removed."
        tone="not-found"
        primaryAction={{ label: "Go home", onClick: () => void navigation.to(routes.deckList.to()) }}
        secondaryAction={{ label: "Go back", onClick: () => void navigation.back() }}
      />
    );
  }

  return (
    <AppLayout showHeader>
      <CardView {...cardView.content} />
    </AppLayout>
  );
};
