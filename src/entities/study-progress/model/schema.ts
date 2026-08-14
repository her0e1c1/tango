import { z } from "zod";

const authenticatedUidSchema = z.string().min(1, "A confirmed user is required for remote StudyProgress writes");
const studyProgressUidSchema = z.string().min(1, "StudyProgress owner is required");

const studyProgressEditSchema = z.object({
  uid: studyProgressUidSchema,
  cardId: z.string().min(1, "Card id is required"),
  score: z.number().optional(),
  numberOfSeen: z.number().optional(),
  lastSeenAt: z.number().optional(),
  nextSeeingAt: z.date().optional(),
  interval: z.number().optional(),
});

const validateStudyProgressOwner = (
  input: { uid: string; progress: { uid: string } },
  context: z.RefinementCtx
): void => {
  if (input.progress.uid !== input.uid) {
    context.addIssue({
      code: "custom",
      message: "StudyProgress owner does not match the authenticated user",
      path: ["progress", "uid"],
    });
  }
};

export const editStudyProgressSchema = z
  .object({
    uid: authenticatedUidSchema,
    progress: studyProgressEditSchema,
  })
  .superRefine(validateStudyProgressOwner);

export type EditStudyProgressInput = z.infer<typeof editStudyProgressSchema>;
