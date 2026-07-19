import type { Firestore } from "firebase/firestore";

export type FirestoreInitializationState =
  | { status: "initializing" }
  | { status: "ready" }
  | { status: "blocked"; error: Error };

export const createFirestoreRuntime = () => {
  let db: Firestore | undefined;
  let state: FirestoreInitializationState = { status: "initializing" };
  let resolveInitialization: (state: FirestoreInitializationState) => void = () => undefined;
  const listeners = new Set<Callback>();
  const initialization = new Promise<FirestoreInitializationState>((resolve) => {
    resolveInitialization = resolve;
  });

  return {
    initialize: (nextDb: Firestore) => {
      if (state.status === "blocked") throw state.error;
      if (db && db !== nextDb) throw new Error("Firestore runtime is already initialized");
      db = nextDb;
      state = { status: "ready" };
      resolveInitialization(state);
      listeners.forEach((listener) => {
        listener();
      });
    },
    block: (error: Error) => {
      if (state.status === "blocked") return;
      db = undefined;
      state = { status: "blocked", error };
      resolveInitialization(state);
      listeners.forEach((listener) => {
        listener();
      });
    },
    getDb: () => {
      if (db) return db;
      if (state.status === "blocked") throw state.error;
      throw new Error("Firestore is not initialized");
    },
    getState: () => state,
    waitForInitialization: () => initialization,
    subscribe: (listener: Callback) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
};

const firestoreRuntime = createFirestoreRuntime();

export const initializeFirestoreRuntime = firestoreRuntime.initialize;
export const blockFirestoreRuntime = firestoreRuntime.block;
export const getDb = firestoreRuntime.getDb;
export const getFirestoreInitializationState = firestoreRuntime.getState;
export const waitForFirestoreInitialization = firestoreRuntime.waitForInitialization;
export const subscribeFirestoreInitialization = firestoreRuntime.subscribe;
