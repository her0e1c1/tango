import { useStore } from "zustand";

import { cardReadLifecycleStore } from "../model/readLifecycleStore";

export const useCardReadState = () => {
  const lifecycle = useStore(cardReadLifecycleStore);

  return {
    status: lifecycle.status,
    serverConfirmed: lifecycle.status === "ready" && lifecycle.serverConfirmed,
    error: lifecycle.status === "error" ? lifecycle.error : undefined,
  };
};
