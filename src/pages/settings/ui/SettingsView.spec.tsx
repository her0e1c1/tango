import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { createPreferences } from "@/test/factories";

import { SettingsView } from "./SettingsView";

type PreferencesFormFields = NonNullable<ComponentProps<typeof SettingsView>["preferencesForm"]>["fields"];

const fields: PreferencesFormFields = {
  showHeader: { name: "showHeader" },
  showSwipeButtonList: { name: "showSwipeButtonList" },
  showSwipeFeedback: { name: "showSwipeFeedback" },
  darkMode: { name: "darkMode" },
  shuffled: { name: "shuffled" },
  useCardInterval: { name: "useCardInterval" },
  maxNumberOfCardsToLearn: { name: "maxNumberOfCardsToLearn", value: "10", onChange: () => undefined },
  defaultAutoPlay: { name: "defaultAutoPlay" },
  cardInterval: { name: "cardInterval", value: "5", onChange: () => undefined },
};

describe("SettingsView", () => {
  it("composes the preferences form under one page heading without the application shell", () => {
    render(
      <SettingsView
        preferencesForm={{
          preferences: createPreferences(),
          fields,
          maxNumberOfCardsToLearn: 10,
          cardInterval: 5,
        }}
      />
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toHaveClass("text-title");
    expect(screen.getByText("Changes are saved automatically")).toHaveClass("text-ink-muted");
    expect(screen.getByRole("region", { name: "Account" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "tango" })).not.toBeInTheDocument();
  });
});
