import type { PropsWithChildren } from "react";

import { AuthBootstrap, AuthProvider } from "@/app/providers/auth";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <AuthBootstrap />
    {children}
  </AuthProvider>
);
