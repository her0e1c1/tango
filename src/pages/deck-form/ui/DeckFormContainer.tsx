import type * as React from "react";

import { useDeckFormState } from "@/features/deck-edit";
import { routes, useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";
import { RouteNotFound } from "@/widgets/route-not-found";

import { DeckEditor } from "./DeckEditor";

export const DeckFormContainer: React.FC<{ deckId: string }> = ({ deckId }) => {
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
      <DeckEditor deckName={editor.deckName} form={editor.form} saveError={editor.saveError} />
    </AppLayout>
  );
};
