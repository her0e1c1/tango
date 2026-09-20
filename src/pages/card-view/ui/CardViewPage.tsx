import type * as React from "react";
import { useTranslation } from "react-i18next";

import { CardView } from "@/entities/card";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardViewPageModel } from "../model/useCardViewPageModel";

export const CardViewPage: React.FC = () => {
  const { t } = useTranslation();
  const state = useCardViewPageModel();

  if (state == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  return (
    <AppLayout showHeader>
      <CardView {...state} />
    </AppLayout>
  );
};
