import type * as React from "react";
import { useTranslation } from "react-i18next";

import { BackText, type Card } from "@/entities/card";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardEditPageModel, useCardEditRouteModel } from "../model/useCardEditPageModel";
import { CardEditor } from "./CardEditor";

const CardEditContainer: React.FC<{ card: Card }> = ({ card }) => {
  const model = useCardEditPageModel(card);

  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      <CardEditor
        cardInfo={model.cardInfo}
        categories={model.categories}
        preview={<BackText {...model.preview} />}
        form={model.form}
        onCancel={model.onCancel}
        onSubmit={model.onSubmit}
      />
    </AppLayout>
  );
};

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
