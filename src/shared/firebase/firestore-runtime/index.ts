/** Coordinates the one-time availability of the shared Firestore instance. */

import type { Firestore } from "firebase/firestore";

export type FirestoreInitializationResult = { status: "ready" } | { status: "blocked"; error: Error };

type FirestoreRuntimeState =
  | { status: "initializing" }
  | { status: "ready"; db: Firestore }
  | { status: "blocked"; error: Error };

const createFirestoreRuntime = () => {
  let state: FirestoreRuntimeState = { status: "initializing" };
  let resolveInitialization: (result: FirestoreInitializationResult) => void = () => undefined;
  const initialization = new Promise<FirestoreInitializationResult>((resolve) => {
    resolveInitialization = resolve;
  });

  return {
    initialize: (db: Firestore) => {
      if (state.status === "blocked") throw state.error;
      if (state.status === "ready") {
        if (state.db !== db) throw new Error("Firestore runtime is already initialized");
        return;
      }

      state = { status: "ready", db };
      resolveInitialization({ status: "ready" });
    },
    block: (error: Error) => {
      if (state.status === "blocked") return;
      if (state.status === "ready") throw new Error("Firestore runtime is already initialized");

      state = { status: "blocked", error };
      resolveInitialization({ status: "blocked", error });
    },
    getDb: () => {
      if (state.status === "ready") return state.db;
      if (state.status === "blocked") throw state.error;
      throw new Error("Firestore is not initialized");
    },
    waitForInitialization: () => initialization,
  };
};

const firestoreRuntime = createFirestoreRuntime();

export const initializeFirestoreRuntime = firestoreRuntime.initialize;
export const blockFirestoreRuntime = firestoreRuntime.block;
export const getDb = firestoreRuntime.getDb;
export const waitForFirestoreInitialization = firestoreRuntime.waitForInitialization;
