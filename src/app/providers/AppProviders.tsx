import type { PropsWithChildren } from "react";

import { AuthBootstrap } from "@/app/providers/auth";
import { RemoteReadProvider } from "@/app/providers/remote-read";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AuthBootstrap>
    <RemoteReadProvider>{children}</RemoteReadProvider>
  </AuthBootstrap>
);
