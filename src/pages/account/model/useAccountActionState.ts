import { useRef, useState } from "react";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import type { AccountActionControls } from "./types";

export const useAccountActionState = () => {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const isMounted = useMountedGuard();
  const controls: AccountActionControls = { pendingRef, setPending, isMounted };
  return { pending, controls };
};
