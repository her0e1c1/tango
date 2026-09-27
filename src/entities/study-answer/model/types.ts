/** Recall grade selected for a study answer. */
export type StudyRating =
  /** Recall failed and the Card needs another attempt. */
  | "again"
  /** Recall succeeded with difficulty. */
  | "hard"
  /** Recall succeeded with normal effort. */
  | "good"
  /** Recall succeeded easily. */
  | "easy";

export interface StudyAnswerRecord {
  /** Stable identity of the answer event. */
  id: string;
  /** Deck containing the answered Card. */
  deckId: string;
  /** Study run in which the answer was submitted. */
  sessionId: string;
  /** Answer time in Unix milliseconds. */
  answeredAt: number;
  /** Recall grade selected for this answer. */
  rating: StudyRating;
}

export interface StudyAnswerInput extends StudyAnswerRecord {
  /** Firebase UID of the answer owner. */
  uid: string;
  /** Identity of the answered Card. */
  cardId: string;
}

export interface StudyAnswerHistory {
  /** Valid answer events ordered newest first. */
  records: StudyAnswerRecord[];
  /** Whether the snapshot came from local cache or the server. */
  source: "cache" | "server";
  /** Whether more matching documents exist beyond the requested limit. */
  truncated: boolean;
  /** Number of invalid documents skipped within the requested limit. */
  invalidCount: number;
  /** Whether this snapshot contains local writes not yet acknowledged. */
  hasPendingWrites: boolean;
}
