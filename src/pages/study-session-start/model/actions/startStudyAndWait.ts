import type { Dispatch, SetStateAction } from "react";
import { getAuthUid } from "@/entities/auth";
import { waitForStudySession } from "@/entities/study-session";
import type { DeckFilterValues } from "@/features/deck-filter";
import { startStudySession } from "./startStudySession";

export async function startStudyAndWait(
  deckId: string,
  filter: DeckFilterValues,
  setPendingSessionId: Dispatch<SetStateAction<string | undefined>>,
  signal: AbortSignal
): Promise<boolean> {
  const uid = getAuthUid();
  const isCurrent = () => !signal.aborted && getAuthUid() === uid;
  const sessionId = await startStudySession(deckId, filter);
  if (sessionId === undefined || !isCurrent()) return false;
  setPendingSessionId(sessionId);
  const ready = await waitForStudySession(uid, deckId, sessionId, signal);
  return ready && isCurrent();
}
