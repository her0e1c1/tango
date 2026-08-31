import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { type Deck, useDeck } from "@/entities/deck";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardCreateForm } from "../model/useCardCreateForm";
import { CardCreator } from "./CardCreator";

const AvailableCardCreatePage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigate = useNavigate();
  const destination = routes.cardList.to(deck.id);
  const state = useCardCreateForm({
    deck,
    onCreated: () => void navigate(destination, { replace: true }),
  });
  const cancel = () => {
    state.dismissSaveError();
    void navigate(destination);
  };

  return (
    <AppLayout showHeader>
      <CardCreator
        categories={state.categories}
        deckName={state.deckName}
        form={state.form}
        onCancel={cancel}
        onSubmit={state.onSubmit}
      />
    </AppLayout>
  );
};

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

  // Form state and generated identity belong to one target Deck and must reset when the route changes.
  return <AvailableCardCreatePage key={deckId} deck={deck} />;
};
