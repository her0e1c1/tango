/**
 * @file Implements the Firestore adapter responsibility for Runtime.
 * This boundary translates between Tango's application models and Firebase so feature code does
 * not handle database details directly.
 */

import type { Firestore } from "firebase/firestore";

export type FirestoreInitializationState =
  | { status: "initializing" }
  | { status: "ready" }
  | { status: "blocked"; error: Error };

/**
 * Creates an isolated Firestore runtime that tracks initialization state and subscribers.
 * It exposes the database only after initialization succeeds and preserves a blocking error when
 * persistence cannot be trusted.
 */
export const createFirestoreRuntime = () => {
  let db: Firestore | undefined;
  let state: FirestoreInitializationState = { status: "initializing" };
  /**
   * Stores the resolver that completes the Firestore initialization promise.
   * The placeholder is replaced when the runtime is created and called exactly when initialization
   * succeeds or is blocked.
   */
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

/**
 * Initializes firestore runtime for use by the Firestore adapter.
 * Required defaults and services are connected before callers receive control.
 */
export const initializeFirestoreRuntime = firestoreRuntime.initialize;
/**
 * Marks the Firestore runtime as unavailable because initialization could not be trusted.
 * Readers then receive the same blocking error instead of silently using a partially initialized
 * database.
 */
export const blockFirestoreRuntime = firestoreRuntime.block;
/**
 * Returns the initialized Firestore database instance.
 * Calling it before initialization, or after persistence was blocked, produces the corresponding
 * startup error.
 */
export const getDb = firestoreRuntime.getDb;
/**
 * Returns the current Firestore initialization snapshot.
 * Consumers use this synchronous value to decide whether remote reads may start.
 */
export const getFirestoreInitializationState = firestoreRuntime.getState;
/**
 * Returns the promise that settles when Firestore becomes ready or blocked.
 * Startup code can await one shared result instead of racing individual initialization steps.
 */
export const waitForFirestoreInitialization = firestoreRuntime.waitForInitialization;
/**
 * Subscribes to changes in Firestore initialization state.
 * The returned cleanup function removes the listener when its React or query consumer is disposed.
 */
export const subscribeFirestoreInitialization = firestoreRuntime.subscribe;
