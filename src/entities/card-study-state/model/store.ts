import { createStore } from "zustand/vanilla";
import type { CardStudyStateDocument } from "../api/document";
export const cardStudyStateStore = createStore<{
  states: Readonly<Record<string, CardStudyStateDocument>>;
  error: Error | undefined;
}>(() => ({ states: {}, error: undefined }));
