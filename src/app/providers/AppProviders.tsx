import type { PropsWithChildren } from "react";

import { AuthBootstrap } from "./AuthBootstrap";
import { AuthProvider } from "@/shared/auth";

export const AppProviders = ({ children }: PropsWithChildren) => (
  <AuthProvider>
    <AuthBootstrap />
    {children}
  </AuthProvider>
);
