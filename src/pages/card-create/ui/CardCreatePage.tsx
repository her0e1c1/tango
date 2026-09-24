import type * as React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";

import { BackText } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { useCardCreatePageModel, useCardCreateRouteModel } from "../model/useCardCreatePageModel";
import { CardCreator } from "./CardCreator";

const CardCreateContainer: React.FC<{ deck: Deck }> = ({ deck }) => {
  const model = useCardCreatePageModel(deck.id);

  return (
    <AppLayout showHeader>
      <CardCreator
        tagRowIds={model.tagRowIds}
        tagOptions={model.tagOptions}
        onAddTag={model.onAddTag}
        onRenameTag={model.onRenameTag}
        onRemoveTag={model.onRemoveTag}
        onSelectTag={model.onSelectTag}
        preview={<BackText {...model.preview} />}
        availableTags={model.availableTags}
        deckName={deck.name}
        form={model.form}
        pending={model.pending}
        onCancel={model.onCancel}
        onSubmit={model.onSubmit}
      />
      {model.navigationGuard}
    </AppLayout>
  );
};

export const CardCreatePage: React.FC = () => {
  const { t } = useTranslation();
  const params = useParams();
  const { deckId, deck } = useCardCreateRouteModel(params.id);
  if (deck === undefined) {
    return (
      <RouteNotFound title={t("cardForm.deckNotFound.title")} description={t("cardForm.deckNotFound.description")} />
    );
  }

  // Form values belong to one target Deck and must reset when the route changes.
  return <CardCreateContainer key={deckId} deck={deck} />;
};
