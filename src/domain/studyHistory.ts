/** @file Defines Firebase-independent study history contracts. */

export type StudyOutcome = "mastered" | "notMastered";

export interface StudyAttempt {
  id: string;
  uid: string;
  sessionId: string;
  deckId: DeckId;
  cardId: CardId;
  outcome: StudyOutcome;
  answeredAt: number;
  localDate: string;
  timeZone: string;
  schemaVersion: 1;
}

export interface StudyAttemptRange {
  fromInclusive: number;
  toExclusive: number;
  limit: number;
}
