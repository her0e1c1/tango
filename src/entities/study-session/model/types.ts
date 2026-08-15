import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";

/**
 * Persisted progress for one deck's study run.
 *
 * Starting the same deck again replaces its existing session. A session keeps
 * the original card order so resuming does not reshuffle cards midway through
 * the run. Hydration treats persisted values as untrusted and restores only
 * sessions that preserve the invariants documented below.
 */
export interface StudySession {
  /** Describes the study lifecycle without overloading missing card data as completion. */
  status: "studying" | "completed";
  /** Must match its key in {@link StudySessions}; hydration drops mismatches. */
  deckId: DeckId;
  /** Snapshot fixed at start so later caller mutations cannot reorder the run. */
  cardOrderIds: CardId[];
  /** Last valid index reached in {@link cardOrderIds}. */
  currentIndex: number;
  /** Drives recent-deck ordering and advances only when the session is started or used. */
  lastStudiedAt: number;
}

/**
 * Study sessions indexed by deck identifier.
 *
 * A deck is absent until study starts and after its session is reset or removed
 * with the deck. Completed sessions remain explicit until either event. Persisted entries are validated independently
 * so one corrupt session does not discard valid progress for other decks.
 */
export type StudySessions = Partial<Record<DeckId, StudySession>>;
