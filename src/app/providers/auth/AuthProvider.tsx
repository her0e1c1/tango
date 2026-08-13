import { useEffect, type PropsWithChildren } from "react";

import { AuthSessionProvider, authRuntime, type AuthRuntime } from "@/entities/auth-session";

type AuthProviderProps = PropsWithChildren<{ runtime?: AuthRuntime }>;

export const AuthProvider = ({ children, runtime = authRuntime }: AuthProviderProps) => {
  useEffect(() => {
    runtime.controller.start();
  }, [runtime]);

  return <AuthSessionProvider store={runtime.authSessionStore}>{children}</AuthSessionProvider>;
};
