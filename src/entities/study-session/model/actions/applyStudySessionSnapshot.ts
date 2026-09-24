import type { SyncedQueryResult } from "@/shared/api";
import { compareStudySessionCreation } from "../rules";
import { studySessionStore } from "../store";
import type { StudySessionSnapshot } from "../types";

export function applyStudySessionSnapshot(
  uid: string,
  scope: string,
  result: SyncedQueryResult<StudySessionSnapshot | null>
) {
  if (studySessionStore.getState().ownerUid !== uid) return;
  const history = result.values.filter((value) => value !== null);
  const latest = new Map<string, StudySessionSnapshot>();
  for (const record of history) {
    const previous = latest.get(record.session.deckId);
    if (!previous || compareStudySessionCreation(record.session, previous.session) > 0)
      latest.set(record.session.deckId, record);
  }
  const sync = { ...studySessionStore.getState().sync };
  if (result.checkpoint === null) delete sync[scope];
  else if (result.checkpoint) sync[scope] = result.checkpoint;
  return studySessionStore.setState({
    history,
    sessionsByDeckId: Object.fromEntries(
      [...latest.values()].filter(({ endReason }) => endReason === null).map(({ session }) => [session.deckId, session])
    ),
    remoteLoading: false,
    fromCache: result.fromCache,
    ...(result.checkpoint !== undefined ? { sync } : {}),
  });
}
