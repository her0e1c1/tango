import type { z } from "zod";

import type { CardId } from "@/entities/card/@x/study-progress";
import type { editStudyProgressSchema } from "./schema";

export interface StudyProgress {
  cardId: CardId;
  score: number;
  numberOfSeen: number;
  lastSeenAt?: number;
  nextSeeingAt?: Date;
  interval?: number;
}

export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

export type StudyRating = "mastered" | "not-mastered" | "unrated";

export interface StudyProgressFilter {
  minimumScore: number | null;
  maximumScore: number | null;
  respectNextSeeingAt: boolean;
}

export interface CardProgressFields {
  id: CardId;
  score: number;
  numberOfSeen: number;
  // Schema-derived Cards can retain explicit undefined values, so entity rules accept both optional forms.
  lastSeenAt?: number | undefined;
  nextSeeingAt?: Date | undefined;
  interval?: number | undefined;
}

export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
