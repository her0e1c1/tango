import type { z } from "zod";

import type { CardId } from "@/entities/card/@x/study-progress";
import type { editStudyProgressSchema } from "./schema";

/** Card-scoped learning history shared by Deck filtering, session ordering, and persistence. */
export interface StudyProgress {
  cardId: CardId;
  /** Signed rating streak; switching between mastered and not-mastered passes through zero. */
  score: number;
  /** Number of recorded study interactions, including interactions that do not change the score. */
  numberOfSeen: number;
  lastSeenAt?: number | undefined;
  /** Earliest time the Card is eligible when interval filtering is enabled. */
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
}

/** StudyProgress-owned fields read from the shared physical Firestore document. */
export interface StudyProgressDocumentFields {
  score: number;
  numberOfSeen: number;
  // Zod-inferred physical documents can retain explicit undefined values at optional keys.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
}

/** Firestore patch shape: cardId selects the document and every progress field is independently optional. */
export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

/** Learning outcome derived from one study interaction. */
export type StudyRating = "mastered" | "not-mastered" | "unrated";

/** Inclusive score and due-time constraints for Card eligibility. */
export interface StudyProgressFilter {
  minimumScore: number | null;
  maximumScore: number | null;
  respectNextSeeingAt: boolean;
}

/** Ordering and size controls used when starting a study session. */
export interface StudyCardOrderOptions {
  shuffled: boolean;
  maxNumberOfCardsToLearn: number;
}

/** Validated authenticated command for editing persisted StudyProgress. */
export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
