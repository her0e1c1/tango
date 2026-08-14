import { useEffect, type PropsWithChildren } from "react";

import { startAuthSession } from "./authLifecycle";

export const AuthBootstrap = ({ children }: PropsWithChildren) => {
  useEffect(startAuthSession, []);

  return children;
};
