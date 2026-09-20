import { studyOperationSchema, type StudyOperation } from "../model/studyOperation";

function storageKey(uid: string, sessionId: string): string {
  return `tango-study-operation:${JSON.stringify([uid, sessionId])}`;
}

export function readPendingStudyOperation(uid: string, sessionId: string): StudyOperation | undefined {
  const stored = sessionStorage.getItem(storageKey(uid, sessionId));
  if (stored === null) return undefined;
  try {
    const parsed = studyOperationSchema.safeParse(JSON.parse(stored));
    if (parsed.success && parsed.data.uid === uid && parsed.data.sessionId === sessionId) return parsed.data;
  } catch {
    // An interrupted or manually edited storage value is not a valid accepted answer.
  }
  return undefined;
}

export function savePendingStudyOperation(operation: StudyOperation): void {
  sessionStorage.setItem(storageKey(operation.uid, operation.sessionId), JSON.stringify(operation));
}

export function clearPendingStudyOperation(operation: StudyOperation): void {
  const current = readPendingStudyOperation(operation.uid, operation.sessionId);
  if (current?.id === operation.id) sessionStorage.removeItem(storageKey(operation.uid, operation.sessionId));
}
