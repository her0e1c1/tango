import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";

import { CATEGORY, type Deck, useDeck } from "@/entities/deck";
import type { CardFormFields } from "@/features/card-form";
import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardCreatePageModel } from "../model/useCardCreatePageModel";
import { CardCreator } from "./CardCreator";

const AvailableCardCreatePage: React.FC<{ deck: Deck }> = ({ deck }) => {
  const navigate = useNavigate();
  const destination = routes.cardList.to(deck.id);
  const { form, submit } = useCardCreatePageModel(deck.id);
  const create = async (values: CardFormFields): Promise<void> => {
    if (await submit(values)) {
      void navigate(destination, { replace: true });
    }
  };

  return (
    <AppLayout showHeader>
      <CardCreator
        categories={CATEGORY}
        deckName={deck.name}
        form={form}
        onCancel={() => void navigate(destination)}
        onSubmit={create}
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

  // Form values belong to one target Deck and must reset when the route changes.
  return <AvailableCardCreatePage key={deckId} deck={deck} />;
};
