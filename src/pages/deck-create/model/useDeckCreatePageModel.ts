import { useEffect } from "react";
import { useStore } from "zustand";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";

import { dismissSaveError } from "./actions/dismissSaveError";
import { enterDeckCreation } from "./actions/enterDeckCreation";
import { leaveDeckCreation } from "./actions/leaveDeckCreation";
import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const { form } = useDeckCreateFormState();
  const pending = useStore(deckCreatePageStore, (state) => state.pending);
  const isMounted = useMountedGuard();
  useEffect(() => {
    const session = enterDeckCreation();
    return () => leaveDeckCreation(session);
  }, []);
  return { form, pending, isMounted, submit: submitDeckCreation, dismissSaveError };
}
