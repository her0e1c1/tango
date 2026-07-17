import { useStore } from "zustand";

import { configStore } from "@/features/settings/state/configStore";

export const useConfig = (): ConfigState => useStore(configStore, (state) => state.config);
