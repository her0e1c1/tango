import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

/** Progress for one active study run. Restarting a deck creates a new run. */
export interface StudySession {
  /** Identifies the run so delayed operations cannot update its replacement. */
  readonly sessionId: string;
  /** The deck whose progress this session tracks. Also the key in StudySessions. */
  deckId: DeckId;
  /** Card order fixed at the start; resuming does not select or shuffle cards again. */
  cardOrderIds: CardId[];
  /** Zero-based position in cardOrderIds. Completed runs leave the active session map. */
  currentIndex: number;
  /** Last use in Unix milliseconds, used to order recently studied decks. */
  lastStudiedAt: number;
  /** Persistence ownership and timestamps for this run. */
  remote: {
    /** Owner of the Firestore document, including anonymous users. */
    uid: string;
    /** Run start in Unix milliseconds; resuming keeps the original value. */
    startedAt: number;
    /** Document creation time in Unix milliseconds, populated by the subscription to select the newest run. */
    createdAt?: number | undefined;
  };
}

/** Currently loaded active progress, keyed by deck. */
export type StudySessions = Partial<Record<DeckId, StudySession>>;

export interface StudySessionSnapshot {
  /** Progress captured for persistence. */
  session: StudySession;
  /** Completion or abandonment reason; null while the run is active. */
  endReason: "completed" | "abandoned" | null;
  /** Run end time in Unix milliseconds; null while active. */
  endedAt: number | null;
}

export interface StudyHistoryRecord {
  /** Stable identity of the study run. */
  sessionId: string;
  /** Deck studied during this run. */
  deckId: string;
  /** Run start time in Unix milliseconds. */
  startedAt: number;
  /** Run end time in Unix milliseconds; null while active. */
  endedAt: number | null;
  /** Completion or abandonment reason; null while the run is active. */
  endReason: "completed" | "abandoned" | null;
  /** Number of Cards in the fixed study order. */
  cardCount: number;
  /** Run start or end time in Unix milliseconds, selected by the history metric. */
  occurredAt: number;
}

export interface StudyHistoryPeriod {
  /** Inclusive start of the history interval in Unix milliseconds. */
  start: number;
  /** Exclusive end of the history interval in Unix milliseconds. */
  end: number;
}
