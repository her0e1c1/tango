/**
 * @file Provides the application-wide Use Config React hook.
 * It gives components a focused view of shared state and operations without exposing the
 * underlying store setup.
 */

import { useStore } from "zustand";

import { configStore } from "@/store/configStore";

/**
 * Returns the current validated application configuration from the shared store.
 * The hook subscribes React to configuration changes while hiding the store implementation.
 */
export const useConfig = (): ConfigState => useStore(configStore, (state) => state.config);
