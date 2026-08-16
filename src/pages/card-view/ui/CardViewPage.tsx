import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardView, useCardViewContent } from "@/features/card-view";
import { AppLayout } from "@/widgets/app-layout";
import { RouteEntityBoundary } from "@/widgets/route-entity-boundary";

const CardViewContent = ({ cardId }: { cardId: string }) => {
  const content = useCardViewContent(cardId);
  return (
    <AppLayout showHeader>
      <CardView {...content} />
    </AppLayout>
  );
};

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  return (
    <RouteEntityBoundary entity="Card" id={cardId}>
      <CardViewContent cardId={cardId} />
    </RouteEntityBoundary>
  );
};
