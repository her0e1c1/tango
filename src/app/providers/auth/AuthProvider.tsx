import { useEffect, type PropsWithChildren } from "react";

import { AuthSessionProvider } from "@/entities/auth-session";

import { authRuntime, type AuthRuntime } from "./authController";

type AuthProviderProps = PropsWithChildren<{ runtime?: AuthRuntime }>;

export const AuthProvider = ({ children, runtime = authRuntime }: AuthProviderProps) => {
  useEffect(() => {
    runtime.start();
  }, [runtime]);

  return <AuthSessionProvider store={runtime.authSessionStore}>{children}</AuthSessionProvider>;
};
