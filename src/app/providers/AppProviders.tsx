import { useEffect, type PropsWithChildren } from "react";

import { RemoteReadProvider } from "@/app/providers/remote-read";
import { startAuthSession } from "./auth/lifecycle";

export const AppProviders = ({ children }: PropsWithChildren) => {
  useEffect(startAuthSession, []);

  return <RemoteReadProvider>{children}</RemoteReadProvider>;
};
