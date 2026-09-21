import { useCards } from "@/entities/card";
import { useDecks } from "@/entities/deck";
import { usePreferences } from "@/entities/preference";
import { useStudySessions } from "@/entities/study-session";
import { useDeadlineQuery } from "@/shared/lib/useDeadlineQuery";

import { buildDeckListSections } from "./buildDeckListSections";

export const useDeckListState = () => {
  const cards = useCards();
  const decks = useDecks();
  const sessionsByDeckId = useStudySessions();
  const { study } = usePreferences();

  return useDeadlineQuery(buildDeckListSections, [
    { decks, cards, sessionsByDeckId, useCardInterval: study.useCardInterval },
  ]);
};
