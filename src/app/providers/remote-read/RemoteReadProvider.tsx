import { type PropsWithChildren, useEffect } from "react";

import { startRemoteReadSessionLifecycle } from "./lifecycle";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  useEffect(startRemoteReadSessionLifecycle, []);

  return children;
};
