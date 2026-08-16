import type * as React from "react";
import { useParams } from "react-router-dom";

import { DeckEditForm, useDeckFormState } from "@/features/deck-edit";
import { routes, useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteEntityBoundary } from "@/widgets/route-entity-boundary";

const DeckFormContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const goToList = () => void navigation.to(routes.deckList.to(), { replace: true });
  const editor = useDeckFormState({ deckId, onCancel: goToList, onSaved: goToList });

  return (
    <AppLayout showHeader>
      <DeckEditForm deckName={editor.deckName} form={editor.form} saveError={editor.saveError} />
    </AppLayout>
  );
};

export const DeckFormPage: React.FC = () => {
  const params = useParams();
  const deckId = params.id;
  if (deckId == null) throw new Error("invalid deck id");

  return (
    <RouteEntityBoundary entity="Deck" id={deckId}>
      {/* Form state belongs to one route Deck and must reset when the id changes. */}
      <DeckFormContent key={deckId} deckId={deckId} />
    </RouteEntityBoundary>
  );
};
