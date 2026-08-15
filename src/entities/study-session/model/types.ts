import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

export interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
  lastStudiedAt: number;
}

export type StudySessions = Partial<Record<DeckId, StudySession>>;
