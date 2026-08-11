import { useEffect, type PropsWithChildren } from "react";

import { SessionProvider } from "@/entities/session";
import { authRuntime, type AuthRuntime } from "@/features/auth";

type AuthProviderProps = PropsWithChildren<{ runtime?: AuthRuntime }>;

export const AuthProvider = ({ children, runtime = authRuntime }: AuthProviderProps) => {
  useEffect(() => {
    runtime.controller.start();
  }, [runtime]);

  return <SessionProvider store={runtime.sessionStore}>{children}</SessionProvider>;
};
