import type { z } from "zod";

import type { CardId } from "@/entities/card/@x/study-progress";
import type { Difficulty } from "./difficulty";
import type { editStudyProgressSchema } from "./schema";

/** Card-scoped learning history shared by Deck filtering, session ordering, and persistence. */
export interface StudyProgress {
  cardId: CardId;
  /** Relative Card difficulty, where larger values are harder. */
  difficulty: Difficulty;
  /** Number of recorded study interactions, including interactions that do not change the difficulty. */
  numberOfSeen: number;
  lastSeenAt?: number;
  /** Earliest time the Card is eligible when interval filtering is enabled. */
  nextSeeingAt?: Date;
  interval?: number;
}

/** StudyProgress-owned fields read from the shared physical Firestore document. */
interface StudyProgressDocumentSharedFields {
  numberOfSeen: number;
  // Zod-inferred physical documents can retain explicit undefined values at optional keys.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
}

/** Current documents may retain a physical legacy score, but difficulty is authoritative. */
interface CurrentStudyProgressDocumentFields extends StudyProgressDocumentSharedFields {
  difficulty: Difficulty;
  score?: number | undefined;
}

/** Legacy documents are adapted only when the difficulty field is absent. */
interface LegacyStudyProgressDocumentFields extends StudyProgressDocumentSharedFields {
  difficulty?: undefined;
  score: number;
}

export type StudyProgressDocumentFields = CurrentStudyProgressDocumentFields | LegacyStudyProgressDocumentFields;

/** Firestore patch shape: cardId selects the document and every progress field is independently optional. */
export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

/** Learning outcome derived from one study interaction. */
export type StudyRating = "mastered" | "not-mastered" | "unrated";

/** Inclusive difficulty and due-time constraints for Card eligibility. */
export interface StudyProgressFilter {
  minimumDifficulty: Difficulty | null;
  maximumDifficulty: Difficulty | null;
  respectNextSeeingAt: boolean;
}

/** Card fields needed to reconstruct its StudyProgress model. */
export interface CardProgressFields {
  id: CardId;
  difficulty: Difficulty;
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
