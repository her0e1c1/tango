import { useEffect, type PropsWithChildren } from "react";

import { AuthSessionProvider } from "@/entities/auth-session";

import type { AuthRuntime } from "./authController";
import { authRuntime } from "./authRuntime";

type AuthProviderProps = PropsWithChildren<{ runtime?: AuthRuntime }>;

export const AuthProvider = ({ children, runtime = authRuntime }: AuthProviderProps) => {
  useEffect(() => {
    runtime.start();
  }, [runtime]);

  return <AuthSessionProvider store={runtime.authSessionStore}>{children}</AuthSessionProvider>;
};
