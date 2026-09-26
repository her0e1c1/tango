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
  session: StudySession;
  endReason: "completed" | "abandoned" | null;
  endedAt: number | null;
}

export interface StudyHistoryRecord {
  sessionId: string;
  deckId: string;
  startedAt: number;
  endedAt: number | null;
  endReason: "completed" | "abandoned" | null;
  cardCount: number;
  occurredAt: number;
}

export interface StudyHistoryPeriod {
  start: number;
  end: number;
}
