export type FirestoreSingleTabLeaseState = { status: "ready" } | { status: "blocked"; error: Error };

export interface FirestoreLockManager {
  request: (
    name: string,
    options: { mode: "exclusive"; ifAvailable: true },
    callback: (lock: object | null) => Promise<void>
  ) => Promise<void>;
}

export class FirestoreSingleTabLeaseError extends Error {
  constructor() {
    super("Firestore offline storage is already open in another tab.");
    this.name = "FirestoreSingleTabLeaseError";
  }
}

export class FirestoreSingleTabLeaseUnsupportedError extends Error {
  constructor() {
    super("This browser cannot provide the exclusive lock required for persistent storage.");
    this.name = "FirestoreSingleTabLeaseUnsupportedError";
  }
}

export const startFirestoreSingleTabLease = (locks: FirestoreLockManager) => {
  let release: Callback = () => undefined;
  let resolveReady: (state: FirestoreSingleTabLeaseState) => void = () => undefined;
  const ready = new Promise<FirestoreSingleTabLeaseState>((resolve) => {
    resolveReady = resolve;
  });

  try {
    void locks
      .request("tango-firestore-persistence", { mode: "exclusive", ifAvailable: true }, async (lock) => {
        if (!lock) {
          resolveReady({ status: "blocked", error: new FirestoreSingleTabLeaseError() });
          return;
        }

        resolveReady({ status: "ready" });
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      })
      .catch((error) => {
        resolveReady({ status: "blocked", error: error instanceof Error ? error : new Error(String(error)) });
      });
  } catch (error) {
    resolveReady({ status: "blocked", error: error instanceof Error ? error : new Error(String(error)) });
  }

  return { ready, release: () => release() };
};
