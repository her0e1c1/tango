import type { PropsWithChildren } from "react";

import { AuthProvider } from "@/app/providers/auth";
import { PreferencesPersistenceProvider } from "@/app/providers/preferences-persistence";
import { RemoteReadBootstrap } from "@/app/providers/remote-read";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <PreferencesPersistenceProvider>
    <AuthProvider>
      <RemoteReadBootstrap>{children}</RemoteReadBootstrap>
    </AuthProvider>
  </PreferencesPersistenceProvider>
);
