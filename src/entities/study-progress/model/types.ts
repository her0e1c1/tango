import type { z } from "zod";

import type { Card } from "@/entities/card/@x/study-progress";
import type { editStudyProgressSchema, studyProgressSchema } from "./schema";

export type StudyProgress = z.infer<typeof studyProgressSchema>;

export interface StudyCard<TCard extends Card = Card> {
  card: TCard;
  progress: StudyProgress;
}

export type StudyProgressEdit = Partial<StudyProgress> & Pick<StudyProgress, "cardId">;

export type StudyRating = "mastered" | "not-mastered" | "unrated";

export interface StudyProgressFilter {
  minimumScore: number | null;
  maximumScore: number | null;
  respectNextSeeingAt: boolean;
}

export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
