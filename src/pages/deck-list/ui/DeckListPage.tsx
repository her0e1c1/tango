import type * as React from "react";
import { useKey } from "react-use";

import { useAddSampleDeck } from "@/features/deck-import";
import { useDeckListState } from "@/features/deck-list";
import { routes, useNavigation } from "@/features/navigate";
import { AppLayout } from "@/widgets/app-layout";

import { DeckList } from "./DeckList";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const deckList = useDeckListState();

  useAddSampleDeck();
  useKey("s", () => void navigation.to(routes.settings.to()));
  useKey("i", () => void navigation.to(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <DeckList
        state={deckList}
        onViewDeck={(id) => void navigation.to(routes.cardList.to(id))}
        onContinueDeck={(id) => void navigation.to(routes.deckStudy.to(id))}
        onStartDeck={(id) => void navigation.to(routes.deckStudyStart.to(id))}
        onEditDeck={(id) => void navigation.to(routes.deckForm.to(id))}
      />
    </AppLayout>
  );
};
