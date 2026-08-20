import type * as React from "react";
import { useParams } from "react-router-dom";

import { StudySessionStartContainer } from "./StudySessionStartContainer";

export const StudySessionStartPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Session setup state belongs to one route Deck and must reset when the id changes.
  return <StudySessionStartContainer key={deckId} deckId={deckId} />;
};
