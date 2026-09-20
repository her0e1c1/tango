import type * as React from "react";

import { BackText, type Card } from "@/entities/card";
import { AppLayout } from "@/widgets/app-layout";

import { useCardEditPageModel } from "../model/useCardEditPageModel";
import { CardEditor } from "./CardEditor";

export const CardEditContainer: React.FC<{ card: Card }> = ({ card }) => {
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
