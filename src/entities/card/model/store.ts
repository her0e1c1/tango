import { createStore } from "zustand/vanilla";
import type { Card } from "./types";

export const cardStore = createStore<{ remoteCards: Card[] }>()(() => ({ remoteCards: [] }));
