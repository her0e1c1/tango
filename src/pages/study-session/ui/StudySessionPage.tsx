import type * as React from "react";
import { useParams } from "react-router-dom";

import { StudySessionContainer } from "./StudySessionContainer";

export const StudySessionPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  // Study state belongs to one route Deck, so id changes start a fresh Feature lifecycle.
  return <StudySessionContainer key={deckId} deckId={deckId} />;
};
