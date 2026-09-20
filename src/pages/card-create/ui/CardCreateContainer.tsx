import type * as React from "react";

import { BackText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { AppLayout } from "@/widgets/app-layout";

import { useCardCreatePageModel } from "../model/useCardCreatePageModel";
import { CardCreator } from "./CardCreator";

export const CardCreateContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const { form, preview, categories, navigationGuard, onCancel, onSubmit } = useCardCreatePageModel(deck.id);

  return (
    <AppLayout showHeader>
      <CardCreator
        preview={<BackText {...preview} />}
        categories={categories}
        deckName={deck.name}
        form={form}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
      {navigationGuard}
    </AppLayout>
  );
};
