import type * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useKey } from "react-use";

import { routes } from "@/shared/router";

import { CardListContainer } from "./CardListContainer";

export const CardListPage: React.FC = () => {
  const params = useParams();
  const navigate = useNavigate();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  useKey("t", () => void navigate(routes.deckList.to()));
  useKey("s", () => void navigate(routes.settings.to()));

  // Filter, dialog, and shown-card state belong to one Deck and must not survive a route change.
  return <CardListContainer key={deckId} deckId={deckId} />;
};
