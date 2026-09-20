import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardCreateRouteModel } from "../model/useCardCreatePageModel";
import { CardCreateContainer } from "./CardCreateContainer";

export const CardCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { deckId, deck } = useCardCreateRouteModel(params.id);
  if (deck === undefined) {
    return (
      <RouteNotFound title={t("cardForm.deckNotFound.title")} description={t("cardForm.deckNotFound.description")} />
    );
  }

  // Form values belong to one target Deck and must reset when the route changes.
  return <CardCreateContainer key={deckId} deck={deck} />;
};
