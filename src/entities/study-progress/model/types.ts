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

export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
