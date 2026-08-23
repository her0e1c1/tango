import type * as React from "react";
import { useNavigate } from "react-router-dom";

import { routes } from "@/shared/router";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreateState } from "../model/useDeckCreateState";
import { DeckCreateView } from "./DeckCreateView";

export const DeckCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const state = useDeckCreateState({
    onCancel: () => void navigate(routes.deckList.to()),
    onCreated: (deckId) => void navigate(routes.cardList.to(deckId), { replace: true }),
  });

  return (
    <AppLayout showHeader>
      <DeckCreateView form={state.form} saveError={state.saveError} />
    </AppLayout>
  );
};
