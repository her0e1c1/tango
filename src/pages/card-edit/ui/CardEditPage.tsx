import type * as React from "react";
import { useTranslation } from "react-i18next";

import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardEditRouteModel } from "../model/useCardEditPageModel";
import { CardEditContainer } from "./CardEditContainer";

export const CardEditPage: React.FC = () => {
  const { t } = useTranslation();
  const { cardId, card } = useCardEditRouteModel();

  if (card == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  // Form state belongs to one route Card and must reset when the id changes.
  return <CardEditContainer key={cardId} card={card} />;
};
