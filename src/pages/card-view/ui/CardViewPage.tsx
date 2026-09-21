import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { CardView } from "@/entities/card";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { MemoryState } from "./MemoryState";
import { useCardViewPageModel } from "../model/useCardViewPageModel";

export const CardViewPage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  if (params.id == null) throw new Error("invalid card id");
  const state = useCardViewPageModel(params.id);

  if (state == null) {
    return (
      <RouteNotFound title={t("cardForm.cardNotFound.title")} description={t("cardForm.cardNotFound.description")} />
    );
  }

  return (
    <AppLayout showHeader>
      <CardView {...state} />
      <MemoryState memory={state.memory} />
    </AppLayout>
  );
};
