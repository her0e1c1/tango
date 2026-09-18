import { useStore } from "zustand";
import { useMountedGuard } from "@/shared/lib/useMountedGuard";
import { useResetStoreOnMount } from "@/shared/lib/useResetStoreOnMount";

import { submitDeckCreation } from "./actions/submitDeckCreation";
import { deckCreatePageStore } from "./store";
import { useDeckCreateFormState } from "./useDeckCreateFormState";

export function useDeckCreatePageModel() {
  const { form } = useDeckCreateFormState();
  const pending = useStore(deckCreatePageStore, (state) => state.mutationId !== undefined);
  const isMounted = useMountedGuard();
  useResetStoreOnMount(deckCreatePageStore);
  return { form, pending, isMounted, submit: submitDeckCreation };
}
