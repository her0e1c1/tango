import { type PropsWithChildren, useEffect } from "react";

import { startPreferencesPersistence } from "./preferencesPersistence";

export const PreferencesPersistenceProvider = ({ children }: PropsWithChildren) => {
  useEffect(() => startPreferencesPersistence(), []);
  return children;
};
