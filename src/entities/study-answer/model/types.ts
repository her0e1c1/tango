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
  rating: "again" | "hard" | "good" | "easy";
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
