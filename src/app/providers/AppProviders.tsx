import type { PropsWithChildren } from "react";

import { AuthProvider } from "@/app/providers/auth";
import { RemoteReadBootstrap } from "@/app/providers/remote-read";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <RemoteReadBootstrap>{children}</RemoteReadBootstrap>
  </AuthProvider>
);
