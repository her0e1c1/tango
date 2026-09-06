import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { useDeck } from "@/entities/deck";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { CardCreateContainer } from "./CardCreateContainer";

export const CardCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const deckId = useParams().id;
  if (deckId === undefined) throw new Error("invalid deck id");
  const deck = useDeck(deckId);
  if (deck === undefined) {
    return (
      <RouteNotFound title={t("cardForm.deckNotFound.title")} description={t("cardForm.deckNotFound.description")} />
    );
  }

  return (
    <AppLayout showHeader>
      {/* Form state and generated identity belong to one target Deck and must reset when the route changes. */}
      <CardCreateContainer key={deckId} deck={deck} />
    </AppLayout>
  );
};
