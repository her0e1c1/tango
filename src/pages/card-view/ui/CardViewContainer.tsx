import type * as React from "react";

import { CardView, useCardViewContent } from "@/features/card-view";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

export const CardViewContainer: React.FC<{ cardId: string }> = ({ cardId }) => {
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
