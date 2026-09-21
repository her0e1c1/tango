import type { StudySchedule } from "./schedule";
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
  schedule?: StudySchedule;
}

/** StudyProgress-owned fields read from the shared physical Firestore document. */
export interface StudyProgressDocumentFields {
  difficulty: Difficulty;
  numberOfSeen: number;
  // Zod-inferred physical documents can retain explicit undefined values at optional keys.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
  schedule?: StudySchedule | undefined;
}

/** Firestore patch shape: cardId selects the document and every progress field is independently optional. */
export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

/** FSRS recall rating; navigation-only interactions have no rating. */
export type { StudyRating } from "@/entities/study-answer/@x/study-progress";

/** Card fields needed to reconstruct its StudyProgress model. */
export interface CardProgressFields {
  id: CardId;
  difficulty: Difficulty;
  numberOfSeen: number;
  // Schema-derived Cards can retain explicit undefined values, so entity rules accept both optional forms.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
  schedule?: StudySchedule | undefined;
}

/** Ordering and size controls used when starting a study session. */
export interface StudyCardOrderOptions {
  useCardInterval?: boolean;
  shuffled: boolean;
  maxNumberOfCardsToLearn: number;
}

/** Validated authenticated command for editing persisted StudyProgress. */
export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
