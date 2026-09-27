import { clearIndexedDbPersistence, terminate } from "firebase/firestore";

let terminationAttempted = false;
let pending: Promise<void> | undefined;

async function clearPersistence(): Promise<void> {
  const { db } = await import("@/shared/firebase");
  if (!terminationAttempted) {
    // Firebase memoizes termination even when its promise rejects.
    terminationAttempted = true;
    await terminate(db);
  }
  // Keep the terminated instance for retries; no other Firestore operations may resume here.
  await clearIndexedDbPersistence(db);
  window.location.reload();
}

export function clearLocalDataAndReload(): Promise<void> {
  pending ??= clearPersistence().finally(() => {
    pending = undefined;
  });
  return pending;
}
