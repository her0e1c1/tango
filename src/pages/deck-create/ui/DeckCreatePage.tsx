import type * as React from "react";

import { DeckForm } from "@/features/deck-form";
import { AppLayout } from "@/widgets/app-layout";

import { useDeckCreatePageModel } from "../model/useDeckCreatePageModel";

export const DeckCreatePage: React.FC = () => {
  const model = useDeckCreatePageModel();

  return (
    <AppLayout showHeader>
      {model.navigationGuard}
      <DeckForm
        mode="create"
        categories={model.categories}
        form={model.form}
        isLocalModeLocked={model.pending}
        onCancel={model.onCancel}
        onSubmit={(event) => void model.onSubmit(event)}
      />
    </AppLayout>
  );
};
