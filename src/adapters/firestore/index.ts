export * as deck from "@/adapters/firestore/deck";
export * as card from "@/adapters/firestore/card";
export * as event from "@/adapters/firestore/event";
export * as mocked from "@/adapters/firestore/mocked";
export { initializeFirestoreAdapter } from "@/adapters/firestore/initialize";
export {
  getDb,
  getFirestoreInitializationState,
  subscribeFirestoreInitialization,
  waitForFirestoreInitialization,
} from "@/adapters/firestore/runtime";
