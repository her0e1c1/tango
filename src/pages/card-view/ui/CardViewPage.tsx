import type * as React from "react";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";

import { CardView, FrontText } from "@/entities/card";
import { Button } from "@/shared/ui/button";
import { routes } from "@/shared/router";
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
      <RouteNotFound
        layout={AppLayout}
        title={t("cardForm.cardNotFound.title")}
        description={t("cardForm.cardNotFound.description")}
      />
    );
  }

  return (
    <AppLayout showHeader>
      <div className="mb-4 flex items-center gap-3">
        <Button onClick={state.toggleSide} aria-pressed={!state.showBackText}>
          {t(state.showBackText ? "cardForm.front.title" : "cardForm.backSide.title")}
        </Button>
        <Link
          to={routes.cardForm.to(params.id)}
          className="min-h-touch rounded-control px-3 py-2 text-accent-primary focus-visible:ring-2 focus-visible:ring-focus"
        >
          {t("cardForm.edit.title")}
        </Link>
      </div>
      {state.showBackText ? (
        <CardView {...state} onClick={state.toggleSide} />
      ) : (
        <FrontText
          text={state.frontText}
          category={state.category}
          ariaLabel={t("deckView.frontAria")}
          onClick={state.toggleSide}
        />
      )}
      <MemoryState memory={state.memory} />
    </AppLayout>
  );
};
