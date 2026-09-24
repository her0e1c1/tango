import { createStore } from "zustand/vanilla";
import { persist } from "zustand/middleware";
import { syncPersistence, type SyncState } from "@/shared/api";

export const studyAnswerStore = createStore<SyncState>()(
  persist(() => ({ sync: {} }), syncPersistence("tango-study-answer-sync"))
);
