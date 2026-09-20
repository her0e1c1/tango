import { z } from "zod";
import { persistedStudyAttemptSchema, type StudyAttemptInput } from "@/entities/study-progress";
import type { StudySession } from "@/entities/study-session";
import type { SwipeDirection } from "@/entities/preference";

export interface PendingStudy {
  uid: string;
  input: StudyAttemptInput;
  session: StudySession;
  direction: SwipeDirection;
  localOnly: boolean;
}

const pendingSchema = z.object({
  uid: z.string().min(1),
  input: z.unknown(),
  session: z.object({
    sessionId: z.string(),
    deckId: z.string(),
    cardOrderIds: z.array(z.string()),
    currentIndex: z.number().int().nonnegative(),
    lastStudiedAt: z.number(),
  }),
  direction: z.enum(["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"]),
  localOnly: z.boolean(),
});

// A browsing context owns its unresolved input; shared localStorage lets another tab overwrite it.
function key(uid: string, sessionId: string): string {
  return `tango-pending-study:${encodeURIComponent(uid)}:${encodeURIComponent(sessionId)}`;
}

export function readPendingStudy(uid: string, session: StudySession): PendingStudy | undefined {
  const raw = sessionStorage.getItem(key(uid, session.sessionId));
  if (raw === null) return;
  const parsed = pendingSchema.parse(JSON.parse(raw));
  const { uid: owner, ...input } = persistedStudyAttemptSchema.parse({ ...(parsed.input as object), uid: parsed.uid });
  if (
    owner !== uid ||
    input.sessionId !== session.sessionId ||
    input.deckId !== session.deckId ||
    parsed.session.sessionId !== session.sessionId ||
    parsed.session.deckId !== session.deckId ||
    parsed.session.cardOrderIds[parsed.session.currentIndex] !== input.cardId
  )
    throw new Error("Invalid pending study");
  return { ...parsed, input };
}

export function savePendingStudy(pending: PendingStudy): void {
  sessionStorage.setItem(key(pending.uid, pending.input.sessionId), JSON.stringify(pending));
}

export function clearPendingStudy(pending: PendingStudy): void {
  // Only remove this operation; another visit may already own the session's unresolved input.
  const current = readPendingStudy(pending.uid, pending.session);
  if (current?.input.operationId === pending.input.operationId)
    sessionStorage.removeItem(key(pending.uid, pending.input.sessionId));
}
