import type { CardId } from "@/entities/card/@x/study-session";
import type { DeckId } from "@/entities/deck/@x/study-session";
import type { StudyProgressEdit } from "@/entities/study-progress/@x/study-session";

/**
 * Persisted progress for one deck's active study run.
 *
 * Starting the same deck again replaces its existing session. A session keeps
 * the original card order so resuming does not reshuffle cards midway through
 * the run. Hydration treats persisted values as untrusted and restores only
 * sessions that preserve the invariants documented below.
 */
export interface StudySession {
  /** Immutable identity for rejecting commits from a study run that has already been replaced. */
  readonly sessionId: string;
  /** Must match its key in {@link StudySessions}; hydration drops mismatches. */
  deckId: DeckId;
  /** Snapshot fixed at start so later caller mutations cannot reorder the run. */
  cardOrderIds: CardId[];
  /** Valid index into {@link cardOrderIds}; completed runs are removed instead of using a terminal index. */
  currentIndex: number;
  /** Drives recent-deck ordering and advances only when the session is started or used. */
  lastStudiedAt: number;
}

/**
 * Active study sessions indexed by deck identifier.
 *
 * A deck is absent until study starts and after its session is completed,
 * reset, or removed with the deck. Persisted entries are validated independently
 * so one corrupt session does not discard valid progress for other decks.
 */
export type StudySessions = Partial<Record<DeckId, StudySession>>;

/** Direction of one valid study-session cursor movement. */
export type StudySessionMovement = "previous" | "next";
/** No-op, exit, or cursor movement produced by a study swipe. */
export type StudySessionSwipeEffect = "none" | "exit" | StudySessionMovement;

/** Pure swipe plan describing its session effect and optional progress patch. */
export type StudySessionSwipePlan =
  | { effect: "none" }
  | { effect: "exit" }
  | {
      effect: StudySessionMovement;
      session: StudySession;
      progress: StudyProgressEdit;
    };

/** Minimal Card identity needed to resolve a study session position. */
export type StudySessionCard = { id: StudySession["cardOrderIds"][number] };
