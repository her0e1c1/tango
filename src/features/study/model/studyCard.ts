import type { Card, CardEdit } from "@/entities/card";
import type { DeckId } from "@/entities/deck";
import { createStudyProgressFromCard, type StudyProgress, type StudyProgressEdit } from "@/entities/study-progress";

type StudyCardContent = Omit<Card, keyof Omit<StudyProgress, "cardId">>;

export interface StudyCard<TCard extends StudyCardContent = StudyCardContent> {
  card: TCard;
  progress: StudyProgress;
}

export const createStudyCard = <TCard extends Card>(card: TCard): StudyCard<TCard> => ({
  card,
  progress: createStudyProgressFromCard(card),
});

export const createCardProgressEdit = (deckId: DeckId, progress: StudyProgressEdit): CardEdit => {
  const { cardId: id, ...edit } = progress;
  return { id, deckId, ...edit };
};
