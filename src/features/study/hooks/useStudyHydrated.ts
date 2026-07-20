/**
 * @file Provides the study feature's Use Study Hydrated React hook.
 * The hook combines state and operations behind one interface so components do not need to
 * coordinate services themselves.
 */

import { useSyncExternalStore } from "react";

import { studyStore } from "@/features/study/state/studyStore";

/**
 * Reports whether the persisted study store has finished loading from browser storage.
 * React uses this value to avoid rendering a session from incomplete state.
 */
const getStudyHydrationSnapshot = () => studyStore.persist.hasHydrated();

/**
 * Subscribes to the start and finish of study-store hydration.
 * The returned cleanup function removes both persistence listeners together.
 */
const subscribeToStudyHydration = (onStoreChange: () => void) => {
  const unsubscribeStart = studyStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinish = studyStore.persist.onFinishHydration(onStoreChange);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
};

/**
 * Subscribes React to whether persisted study state has finished hydrating.
 * The same snapshot is used during server-style rendering so consumers receive a stable boolean
 * instead of reading persistence internals.
 */
export const useStudyHydrated = (): boolean =>
  useSyncExternalStore(subscribeToStudyHydration, getStudyHydrationSnapshot, getStudyHydrationSnapshot);
