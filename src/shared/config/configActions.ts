/**
 * @file Exposes commands that mutate application configuration.
 */

import type { ConfigStoreState } from "@/shared/config/configStore";
import { configStore } from "@/shared/config/configStoreInstance";

type UpdateConfig = ConfigStoreState["updateConfig"];

export const updateConfig: UpdateConfig = (config) => configStore.getState().updateConfig(config);

export const setDarkMode = (darkMode: boolean): void => updateConfig({ appearance: { darkMode } });

export const toggleShowHeader = (): void => configStore.getState().toggleConfig("appearance", "showHeader");

export const toggleShowSwipeButtonList = (): void =>
  configStore.getState().toggleConfig("controls", "showSwipeButtonList");
