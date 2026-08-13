import { beforeEach, describe, expect, it } from "vitest";

import { setDarkMode, toggleShowHeader, toggleShowSwipeButtonList, updateConfig } from "@/shared/config";
import { configStore } from "@/shared/config/configStoreInstance";
import { createConfig } from "@/test/factories";

describe("config actions", () => {
  beforeEach(() => {
    configStore.setState({ config: createConfig({ darkMode: false, showHeader: true, showSwipeButtonList: true }) });
  });

  it("partially updates configuration without replacing other values", () => {
    updateConfig({ study: { maxNumberOfCardsToLearn: 24 } });

    expect(configStore.getState().config.appearance).toMatchObject({ darkMode: false, showHeader: true });
    expect(configStore.getState().config.study.maxNumberOfCardsToLearn).toBe(24);
  });

  it("sets dark mode and toggles study visibility settings", () => {
    setDarkMode(true);
    toggleShowHeader();
    toggleShowSwipeButtonList();

    expect(configStore.getState().config.appearance).toMatchObject({ darkMode: true, showHeader: false });
    expect(configStore.getState().config.controls.showSwipeButtonList).toBe(false);
  });
});
