import { useStore } from "zustand";

import { configStore } from "@/store/configStore";

export const useConfig = (): ConfigState => useStore(configStore, (state) => state.config);
