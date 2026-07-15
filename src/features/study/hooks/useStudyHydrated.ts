import * as React from "react";

import { studyStore } from "@src/features/study/state/studyStore";

export const useStudyHydrated = (): boolean => {
  const [hydrated, setHydrated] = React.useState(() => studyStore.persist.hasHydrated());

  React.useEffect(() => {
    const unsubscribe = studyStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(studyStore.persist.hasHydrated());
    return unsubscribe;
  }, []);

  return hydrated;
};
