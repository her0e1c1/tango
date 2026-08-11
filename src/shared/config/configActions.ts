/**
 * @file Exposes commands that mutate application configuration.
 */

import { configStore, type ConfigStoreState } from "@/shared/config/configStore";

type UpdateConfig = ConfigStoreState["updateConfig"];

export const updateConfig: UpdateConfig = (config) => configStore.getState().updateConfig(config);

export const setDarkMode = (darkMode: boolean): void => updateConfig({ appearance: { darkMode } });

export const toggleShowHeader = (): void => configStore.getState().toggleConfig("appearance", "showHeader");

export const toggleShowSwipeButtonList = (): void =>
  configStore.getState().toggleConfig("controls", "showSwipeButtonList");
