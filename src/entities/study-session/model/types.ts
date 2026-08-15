import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

/**
 * Persisted progress for one deck's active study run.
 *
 * Starting the same deck again replaces its existing session. A session keeps
 * the original card order so resuming does not reshuffle cards midway through
 * the run.
 */
export interface StudySession {
  /** Deck that owns the session and also keys it in {@link StudySessions}. */
  deckId: DeckId;
  /** Card identifiers in the exact order presented during this run. */
  cardOrderIds: CardId[];
  /** Zero-based position of the active card within {@link cardOrderIds}. */
  currentIndex: number;
  /** Unix time in milliseconds when this session was last started or used. */
  lastStudiedAt: number;
}

/**
 * Active study sessions indexed by deck identifier.
 *
 * A deck is absent until study starts and after its session is completed,
 * reset, or removed with the deck.
 */
export type StudySessions = Partial<Record<DeckId, StudySession>>;
