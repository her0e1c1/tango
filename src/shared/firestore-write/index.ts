import { writeBatch, type DocumentReference, getDocFromCache, onSnapshotsInSync } from "firebase/firestore";

import { auth, db } from "../firebase";

const errorListeners = new Set<(error: unknown) => void>();
const pendingWrites = new Map<string, number>();

export function subscribeWriteErrors(listener: (error: unknown) => void): () => void {
  errorListeners.add(listener);
  return () => {
    errorListeners.delete(listener);
  };
}

export function hasUnacknowledgedWrites(uid: string): boolean {
  return (pendingWrites.get(uid) ?? 0) > 0;
}

/** Complete after SDK cache snapshots and active listeners observe the queued write. */
export async function writeLocally(
  uid: string,
  references: DocumentReference[],
  write: () => Promise<void>
): Promise<void> {
  if (auth.currentUser?.uid !== uid) throw new Error("The authenticated account changed before saving");
  pendingWrites.set(uid, (pendingWrites.get(uid) ?? 0) + 1);
  let submitted = false;
  let stop: () => void = () => undefined;
  try {
    const serverWrite = write();
    submitted = true;
    const acknowledged = serverWrite
      .catch((error: unknown) => {
        if (auth.currentUser?.uid === uid) for (const listener of errorListeners) listener(error);
        throw error;
      })
      .finally(() => {
        pendingWrites.set(uid, (pendingWrites.get(uid) ?? 1) - 1);
      });
    // SDK cache reads and listener registration are queued after the write's local application.
    // The sync listener also fires for an unchanged write, unlike a document change listener.
    const reflected = new Promise<void>((resolve) => {
      stop = onSnapshotsInSync(db, resolve);
    });
    const cached = Promise.all(references.map((reference) => getDocFromCache(reference)));
    await Promise.race([Promise.all([reflected, cached]), acknowledged]);
  } finally {
    if (!submitted) pendingWrites.set(uid, (pendingWrites.get(uid) ?? 1) - 1);
    stop();
  }
}

/** Build one SDK batch and retain the existing local-snapshot completion contract. */
export function createLocalBatch(uid: string) {
  const batch = writeBatch(db);
  return { batch, commit: (references: DocumentReference[]) => writeLocally(uid, references, () => batch.commit()) };
}
