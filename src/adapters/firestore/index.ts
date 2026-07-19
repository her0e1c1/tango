export * as deck from "@/adapters/firestore/deck";
export * as card from "@/adapters/firestore/card";
export * as event from "@/adapters/firestore/event";
export * as documentMetadata from "@/adapters/firestore/documentMetadata";
export { initializeFirestoreAdapter } from "@/adapters/firestore/initialize";
export {
  getDb,
  getFirestoreInitializationState,
  subscribeFirestoreInitialization,
  waitForFirestoreInitialization,
} from "@/adapters/firestore/runtime";
