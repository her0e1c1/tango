import type React from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setDarkMode, updatePreferences, usePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { usePreferencesForm } from "./usePreferencesForm";

const preferences = createPreferences({
  showSwipeButtonList: false,
  showPlaybackControls: false,
  showSwipeFeedback: false,
  fullscreen: false,
  darkMode: false,
  shuffled: false,
  useCardInterval: false,
  defaultAutoPlay: false,
  maxNumberOfCardsToLearn: 0,
  cardInterval: 0,
});

const PreferencesFormHarness: React.FC = () => {
  const { form } = usePreferencesForm();
  const savedPreferences = usePreferences();

  return (
    <>
      <input aria-label="Show playback controls" type="checkbox" {...form.register("controls.showPlaybackControls")} />
      <input aria-label="Dark mode" type="checkbox" {...form.register("appearance.darkMode")} />
      <select aria-label="Language" {...form.register("language")}>
        <option value="system">System</option>
        <option value="en">English</option>
        <option value="ja">日本語</option>
      </select>
      <input
        aria-label="Maximum cards"
        type="range"
        {...form.register("study.maxNumberOfCardsToLearn", { valueAsNumber: true })}
      />
      <input
        aria-label="Autoplay interval"
        type="range"
        {...form.register("study.cardInterval", { valueAsNumber: true })}
      />
      <output aria-label="Saved playback controls preference">
        {String(savedPreferences.controls.showPlaybackControls)}
      </output>
      <output aria-label="Saved maximum cards">{savedPreferences.study.maxNumberOfCardsToLearn}</output>
      <output aria-label="Saved autoplay interval">{savedPreferences.study.cardInterval}</output>
      <output aria-label="Saved language preference">{savedPreferences.language}</output>
    </>
  );
};

describe("usePreferencesForm", () => {
  beforeEach(() => {
    updatePreferences(preferences);
  });

  it("saves boolean and numeric changes as the user edits them", async () => {
    render(<PreferencesFormHarness />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Show playback controls" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Language" }), "ja");
    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: 10 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Autoplay interval" }), {
      target: { value: 10 },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Saved playback controls preference")).toHaveTextContent("true");
      expect(screen.getByLabelText("Saved maximum cards")).toHaveTextContent("10");
      expect(screen.getByLabelText("Saved autoplay interval")).toHaveTextContent("10");
      expect(screen.getByLabelText("Saved language preference")).toHaveTextContent("ja");
    });
  });

  it("reflects a theme change saved elsewhere in the application", async () => {
    render(<PreferencesFormHarness />);
    expect(screen.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();

    act(() => {
      setDarkMode(true);
    });

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeChecked();
    });
  });
});
