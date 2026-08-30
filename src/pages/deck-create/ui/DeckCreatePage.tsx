import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { routes, useNavigationGuard } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreateForm } from "../model/useDeckCreateForm";
import { DeckCreateView } from "./DeckCreateView";

export const DeckCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const state = useDeckCreateForm({
    onCreated: (deckId) => {
      const cardListPath = routes.cardList.to(deckId);
      void guard.allowNavigation({ historyAction: "REPLACE", to: cardListPath }, () =>
        navigate(cardListPath, { replace: true })
      );
    },
  });
  const guard = useNavigationGuard(state.isDirty);

  return (
    <AppLayout showHeader>
      {guard.element}
      <DeckCreateView
        categories={state.categories}
        form={state.form}
        isLocalModeLocked={state.isLocalModeLocked}
        onCancel={() => void navigate(routes.deckList.to())}
        onSubmit={state.onSubmit}
        saveError={state.saveError}
      />
    </AppLayout>
  );
};
