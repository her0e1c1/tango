/**
 * @file Provides a ready, connection-free Firestore runtime for Storybook.
 * Route stories seed the application remote store directly; attempted mutations fail immediately
 * instead of opening a real Firestore connection or waiting for production initialization.
 */

export type FirestoreInitializationResult =
  | { status: "ready" }
  | { status: "blocked"; error: Error };

const ready = { status: "ready" } as const satisfies FirestoreInitializationResult;

export const initializeFirestoreRuntime = (_db: unknown): void => undefined;
export const blockFirestoreRuntime = (_error: Error): void => undefined;
export const getDb = (): never => {
  throw new Error("Firestore is unavailable in Storybook page stories");
};
export const waitForFirestoreInitialization = async (): Promise<FirestoreInitializationResult> => ready;
