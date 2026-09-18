import type * as React from "react";

import { DeckForm } from "@/features/deck-form";
import { CATEGORY } from "@/entities/deck";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreatePageModel } from "../model/useDeckCreatePageModel";

export const DeckCreatePage: React.FC = () => {
  const model = useDeckCreatePageModel();

  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      <DeckForm
        mode="create"
        categories={CATEGORY}
        form={model.form}
        isLocalModeLocked={model.pending}
        onCancel={model.onCancel}
        onSubmit={(event) => void model.onSubmit(event)}
      />
    </AppLayout>
  );
};
