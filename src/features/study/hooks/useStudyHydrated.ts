import { useSyncExternalStore } from "react";

import { studyStore } from "@/features/study/state/studyStore";

const getStudyHydrationSnapshot = () => studyStore.persist.hasHydrated();

const subscribeToStudyHydration = (onStoreChange: () => void) => {
  const unsubscribeStart = studyStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinish = studyStore.persist.onFinishHydration(onStoreChange);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
};

export const useStudyHydrated = (): boolean =>
  useSyncExternalStore(subscribeToStudyHydration, getStudyHydrationSnapshot, getStudyHydrationSnapshot);
