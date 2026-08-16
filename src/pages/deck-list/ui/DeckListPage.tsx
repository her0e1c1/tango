import type * as React from "react";
import { useKey } from "react-use";

import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { touchStudySession, useStudySessions } from "@/entities/study-session";
import { useAddSampleDeck } from "@/features/deck-import";
import { DeckList, useDeckListState } from "@/features/deck-list";
import { routes, useNavigation } from "@/shared/routes";
import { AppLayout } from "@/widgets/app-layout";

export const DeckListPage: React.FC = () => {
  const navigation = useNavigation();
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const deckList = useDeckListState({ decks, cards, sessionsByDeckId });

  useAddSampleDeck();
  useKey("s", () => void navigation.to(routes.settings.to()));
  useKey("i", () => void navigation.to(routes.deckImport.to()));

  return (
    <AppLayout showHeader>
      <DeckList
        state={deckList}
        onViewDeck={(id) => void navigation.to(routes.cardList.to(id))}
        onContinueDeck={(id) => {
          touchStudySession(id);
          void navigation.to(routes.deckStudy.to(id));
        }}
        onStartDeck={(id) => void navigation.to(routes.deckStudyStart.to(id))}
        onEditDeck={(id) => void navigation.to(routes.deckForm.to(id))}
      />
    </AppLayout>
  );
};
