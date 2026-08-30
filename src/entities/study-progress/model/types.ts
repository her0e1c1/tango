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
  lastSeenAt?: number;
  /** Earliest time the Card is eligible when interval filtering is enabled. */
  nextSeeingAt?: Date;
  interval?: number;
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

/** Server-verified remote identity that permits a write before the Card subscription publishes its snapshot. */
export interface RemoteStudyProgressTarget {
  persistence: "remote";
  cardId: CardId;
}

/** Learning outcome derived from one study interaction. */
export type StudyRating = "mastered" | "not-mastered" | "unrated";

/** Inclusive score and due-time constraints for Card eligibility. */
export interface StudyProgressFilter {
  minimumScore: number | null;
  maximumScore: number | null;
  respectNextSeeingAt: boolean;
}

/** Card fields needed to reconstruct its StudyProgress model. */
export interface CardProgressFields {
  id: CardId;
  score: number;
  numberOfSeen: number;
  // Schema-derived Cards can retain explicit undefined values, so entity rules accept both optional forms.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
}

/** Ordering and size controls used when starting a study session. */
export interface StudyCardOrderOptions {
  shuffled: boolean;
  maxNumberOfCardsToLearn: number;
}

/** Validated authenticated command for editing persisted StudyProgress. */
export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
