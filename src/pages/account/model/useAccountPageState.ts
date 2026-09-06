import { useState } from "react";
import { useStore } from "zustand";

import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import { createAccountPageStore } from "./store";

export const useAccountPageState = () => {
  // Scope pending work to this Page mount so late completions cannot update a newly mounted Page.
  const [store] = useState(createAccountPageStore);
  const pageState = useStore(store);
  const isMounted = useMountedGuard();
  return { pageState, store, isMounted };
};
