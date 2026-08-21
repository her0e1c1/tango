import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardFormContainer } from "./CardFormContainer";

export const CardFormPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContainer key={cardId} cardId={cardId} />;
};
