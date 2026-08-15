import type { Card } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import type { Preferences } from "@/entities/preferences";
import { startStudySession } from "@/entities/study-session";
import { buildStudyCardOrder } from "@/entities/study-progress";

export const startStudy = (deckId: DeckId, cards: Card[], studyPreferences: Preferences["study"]): void => {
  startStudySession(deckId, buildStudyCardOrder(cards, studyPreferences));
};
