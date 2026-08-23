import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { type Deck, useDeck, useRemoteDecksReady } from "@/entities/deck";
import { routes } from "@/shared/router";
import { RouteFeedback } from "@/shared/ui/route-feedback";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardCreateState } from "../model/useCardCreateState";
import { CardCreateView } from "./CardCreateView";

const AvailableCardCreateContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigate = useNavigate();
  const goToCards = () => void navigate(routes.cardList.to(deck.id));
  const state = useCardCreateState({
    deck,
    onCancel: goToCards,
    onCreated: () => void navigate(routes.cardList.to(deck.id), { replace: true }),
  });

  return (
    <AppLayout showHeader>
      <CardCreateView deckName={state.deckName} form={state.form} saveError={state.saveError} />
    </AppLayout>
  );
};

export const CardCreateContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
  const deck = useDeck(deckId);
  const remoteDecksReady = useRemoteDecksReady();

  if (deck == null) {
    if (!remoteDecksReady) {
      return <RouteFeedback title="Loading deck…" description="Checking the requested deck." tone="loading" />;
    }
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

  return <AvailableCardCreateContainer deck={deck} />;
};
