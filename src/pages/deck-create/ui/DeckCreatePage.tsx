import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreateForm } from "../model/useDeckCreateForm";
import { DeckCreateView } from "./DeckCreateView";

export const DeckCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const state = useDeckCreateForm({
    onCreated: (deckId) => void navigate(routes.cardList.to(deckId), { replace: true }),
  });
  const cancel = () => {
    state.dismissSaveError();
    void navigate(routes.deckList.to());
  };

  return (
    <AppLayout showHeader>
      <DeckCreateView
        categories={state.categories}
        form={state.form}
        isLocalModeLocked={state.isLocalModeLocked}
        onCancel={cancel}
        onSubmit={state.onSubmit}
      />
    </AppLayout>
  );
};
