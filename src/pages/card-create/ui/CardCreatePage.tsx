import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardCreateContainer } from "./CardCreateContainer";

export const CardCreatePage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Form state belongs to one route Deck and must reset when the id changes.
  return <CardCreateContainer key={deckId} deckId={deckId} />;
};
