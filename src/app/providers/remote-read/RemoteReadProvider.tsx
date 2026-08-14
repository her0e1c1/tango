import type { PropsWithChildren } from "react";

import { useAuthSession } from "@/entities/auth";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read";

export const RemoteReadProvider = ({ children }: PropsWithChildren) => {
  const authSession = useAuthSession();
  const uid = authSession.status === "authenticated" ? authSession.uid : null;

  return <RemoteReadScopeProvider uid={uid}>{children}</RemoteReadScopeProvider>;
};
