import { z } from "zod";

export const studyRatingSchema = z.enum(["again", "hard", "good", "easy"]);
