import type { Card } from "@/entities/card";
import type { resolveStudySession } from "@/entities/study-session";

export interface StudyCompletion {
  cardCount: number;
}
export type StudySessionState = ReturnType<typeof resolveStudySession<Card>>;
