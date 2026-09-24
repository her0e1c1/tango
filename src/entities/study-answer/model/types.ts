import type { StudyRating } from "./schema";

export interface StudyAnswerRecord {
  id: string;
  deckId: string;
  sessionId: string;
  answeredAt: number;
  rating: StudyRating;
}

export interface StudyAnswerHistory {
  records: StudyAnswerRecord[];
  source: "cache" | "server";
  truncated: boolean;
  invalidCount: number;
  hasPendingWrites: boolean;
}
