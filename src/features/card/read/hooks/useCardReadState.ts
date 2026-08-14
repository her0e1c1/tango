import { useStore } from "zustand";

import { cardReadLifecycleStore } from "../model/readLifecycleStore";

export const useCardReadState = () => {
  const lifecycle = useStore(cardReadLifecycleStore);

  return {
    status: lifecycle.status,
    syncStatus: lifecycle.status === "ready" ? lifecycle.syncStatus : undefined,
    error: lifecycle.status === "error" ? lifecycle.error : undefined,
    retry: lifecycle.retry,
  };
};
