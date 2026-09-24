import type { StudyRating } from "./schema";

export interface StudyAnswerRecord {
  id: string;
  deckId: string;
  sessionId: string;
  answeredAt: number;
  rating: StudyRating;
}

export interface StudyAnswerInput extends StudyAnswerRecord {
  uid: string;
  cardId: string;
}

export interface StudyAnswerHistory {
  records: StudyAnswerRecord[];
  source: "cache" | "server";
  truncated: boolean;
  invalidCount: number;
  hasPendingWrites: boolean;
}

export interface StudyAnswerSnapshot {
  id: string;
  answeredAt: { seconds: number; nanoseconds: number };
  record: StudyAnswerRecord | null;
}
