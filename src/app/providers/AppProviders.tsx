import type { PropsWithChildren } from "react";

import { PreferencesPersistenceProvider } from "@/app/providers/preferences-persistence";
import { AuthBootstrap } from "@/app/providers/auth";
import { RemoteReadProvider } from "@/app/providers/remote-read";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <PreferencesPersistenceProvider>
    <AuthBootstrap>
      <RemoteReadProvider>{children}</RemoteReadProvider>
    </AuthBootstrap>
  </PreferencesPersistenceProvider>
);
