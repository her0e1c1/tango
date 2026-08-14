import { useEffect, type PropsWithChildren } from "react";

import { RemoteReadProvider } from "@/app/providers/remote-read";
import { startAuthSession } from "./auth/lifecycle";
import { startRemoteReadSession } from "./remote-read/lifecycle";

export const AppProviders = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const stopRemoteReadSession = startRemoteReadSession();
    const stopAuthSession = startAuthSession();

    return () => {
      stopAuthSession();
      stopRemoteReadSession();
    };
  }, []);

  return <RemoteReadProvider>{children}</RemoteReadProvider>;
};
