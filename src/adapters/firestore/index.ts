/**
 * @file Collects the public exports for the adapters firestore area.
 * Callers can import from this boundary without depending on the area's internal folder layout.
 */

export * as documentMetadata from "@/adapters/firestore/documentMetadata";
export { initializeFirestoreAdapter } from "@/adapters/firestore/initialize";
export {
  getDb,
  getFirestoreInitializationState,
  subscribeFirestoreInitialization,
  waitForFirestoreInitialization,
} from "@/adapters/firestore/runtime";
