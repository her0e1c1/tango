import type * as React from "react";
import { useParams } from "react-router-dom";
import { useKey } from "react-use";

import { routes, useNavigation } from "@/features/navigate";

import { CardListContainer } from "./CardListContainer";

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigation = useNavigation();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  useKey("t", () => void navigation.to(routes.deckList.to()));
  useKey("s", () => void navigation.to(routes.settings.to()));

  // Filter, dialog, and shown-card state belong to one Deck and must not survive a route change.
  return <CardListContainer key={deckId} deckId={deckId} />;
};
