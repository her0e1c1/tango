import { createStore } from "zustand/vanilla";

export const cardEditPageStore = createStore<{ submission: Promise<boolean> | undefined }>()(() => ({
  submission: undefined,
}));
