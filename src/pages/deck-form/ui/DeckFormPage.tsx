import type * as React from "react";
import { useParams } from "react-router-dom";

import { DeckFormContainer } from "./DeckFormContainer";

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Form state belongs to one route Deck and must reset when the id changes.
  return <DeckFormContainer key={deckId} deckId={deckId} />;
};
