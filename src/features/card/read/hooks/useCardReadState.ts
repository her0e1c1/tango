import { useStore } from "zustand";

import { cardReadLifecycleStore } from "../model/readLifecycleStore";

export const useCardReadState = () => {
  const lifecycle = useStore(cardReadLifecycleStore);

  return {
    status: lifecycle.status,
    error: lifecycle.status === "error" ? lifecycle.error : undefined,
  };
};
