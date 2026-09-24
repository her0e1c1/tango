import type { z } from "zod";
import type { DeckId } from "@/entities/deck/@x/study-session";
import type { studySessionSchema } from "./schema";

// Identity rejects operations from a run that has already been replaced.
export type StudySession = Omit<z.infer<typeof studySessionSchema>, "sessionId"> & {
  readonly sessionId: string;
};

export type StudySessions = Partial<Record<DeckId, StudySession>>;
