import type * as React from "react";
import { useTranslation } from "react-i18next";
import { AiOutlineEdit } from "react-icons/ai";
import { Link, useParams } from "react-router-dom";

import { routes } from "@/shared/router";
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
      <div className="flex justify-end">
        <Link
          to={routes.cardForm.to(params.id)}
          aria-label={t("cardForm.edit.title")}
          title={t("cardForm.edit.title")}
          className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-control text-ink-muted hover:bg-surface-muted hover:text-ink"
        >
          <AiOutlineEdit aria-hidden="true" className="size-5" />
        </Link>
      </div>
      <CardView {...state} />
      <MemoryState memory={state.memory} />
    </AppLayout>
  );
};
