import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardView, useCardViewContent } from "@/features/card-view";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

const CardViewContent = ({ cardId }: { cardId: string }) => {
  const content = useCardViewContent(cardId);

  if (content == null) {
    return (
      <RouteNotFound title="Card not found" description="The requested card is unavailable or has been removed." />
    );
  }

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

  return <CardViewContent cardId={cardId} />;
};
