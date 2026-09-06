import { useState } from "react";
import { useStore } from "zustand";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import { createAccountActionStore } from "./store";
import type { AccountActionControls } from "./types";

export const useAccountActionState = () => {
  // Each mounted action owns its lock so remounts and opposite auth actions cannot share pending work.
  const [store] = useState(createAccountActionStore);
  const pending = useStore(store, (state) => state.pending);
  const isMounted = useMountedGuard();
  const controls: AccountActionControls = { store, isMounted };
  return { pending, controls };
};
