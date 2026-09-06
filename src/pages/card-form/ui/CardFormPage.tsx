import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useCard } from "@/entities/card";
import { RouteNotFound } from "@/widgets/route-not-found";

import { CardFormContainer } from "./CardFormContainer";

export const CardFormPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const cardId = params.id;
  if (cardId == null) throw new Error("invalid card id");
  const card = useCard(cardId);

  if (card == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardFormContainer key={cardId} card={card} />;
};
