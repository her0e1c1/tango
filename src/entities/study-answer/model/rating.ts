import { z } from "zod";

export const studyRatingSchema = z.enum(["again", "hard", "good", "easy"]);
export type StudyRating = z.infer<typeof studyRatingSchema>;
