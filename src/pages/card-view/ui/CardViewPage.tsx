import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardView } from "@/entities/card";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardViewState } from "../model/useCardViewState";

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  const state = useCardViewState(cardId);

  if (state == null) {
    return (
      <RouteNotFound title="Card not found" description="The requested card is unavailable or has been removed." />
    );
  }

  return (
    <AppLayout showHeader>
      <CardView {...state} />
    </AppLayout>
  );
};
