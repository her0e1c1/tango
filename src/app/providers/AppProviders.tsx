import type { PropsWithChildren } from "react";

import { AuthBootstrap } from "@/auth/AuthBootstrap";
import { AuthProvider } from "@/auth/AuthContext";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <AuthBootstrap />
    {children}
  </AuthProvider>
);
