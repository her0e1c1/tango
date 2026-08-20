import type * as React from "react";
import { useParams } from "react-router-dom";

import { CardViewContainer } from "./CardViewContainer";

export const CardViewPage: React.FC = () => {
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");

  return <CardViewContainer cardId={cardId} />;
};
