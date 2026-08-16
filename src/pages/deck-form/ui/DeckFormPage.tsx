import type * as React from "react";
import { useParams } from "react-router-dom";

import { DeckEditForm, useDeckFormState } from "@/features/deck-edit";
import { routes, useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

const DeckFormContent = ({ deckId }: { deckId: string }) => {
  const navigation = useNavigation();
  const goToList = () => void navigation.to(routes.deckList.to(), { replace: true });
  const editor = useDeckFormState({ deckId, onCancel: goToList, onSaved: goToList });

  if (editor == null) {
    return (
      <RouteNotFound title="Deck not found" description="The requested deck is unavailable or has been removed." />
    );
  }

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

  // Form state belongs to one route Deck and must reset when the id changes.
  return <DeckFormContent key={deckId} deckId={deckId} />;
};
