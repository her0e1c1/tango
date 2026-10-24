import type React from "react";
import { MemoryRouter } from "react-router-dom";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setDarkMode, updatePreferences, usePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { SettingsForm } from "../ui/SettingsForm";

import { useSettingsPageModel } from "./useSettingsPageModel";

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
  const savedPreferences = usePreferences();
  const { form, studyPreferencesLimits } = useSettingsPageModel();

  return (
    <>
      <SettingsForm form={form} studyPreferencesLimits={studyPreferencesLimits} />
      <output aria-label="Saved playback controls preference">
        {String(savedPreferences.controls.showPlaybackControls)}
      </output>
      <output aria-label="Saved maximum cards">{savedPreferences.study.maxNumberOfCardsToLearn}</output>
      <output aria-label="Saved autoplay interval">{savedPreferences.study.cardInterval}</output>
      <output aria-label="Saved language preference">{savedPreferences.language}</output>
      <output aria-label="Saved sample preference">{String(savedPreferences.loadSample)}</output>
      <output aria-label="Saved help preference">{String(savedPreferences.controls.showHelp)}</output>
      <output aria-label="Saved dark mode preference">{String(savedPreferences.appearance.darkMode)}</output>
    </>
  );
};

describe("SETTINGS-01 SETTINGS-02 SETTINGS-04 settings page model", () => {
  beforeEach(() => {
    // Given: Establish the shared setup used by the following cases.
    updatePreferences(preferences);
  });

  it("saves boolean and numeric changes as the user edits them", async () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<PreferencesFormHarness />, { wrapper: MemoryRouter });

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "Show playback controls" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Dark mode" }));
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Language" }), "ja");
    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: 10 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Autoplay interval" }), {
      target: { value: 10 },
    });

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => {
      expect(screen.getByLabelText("Saved playback controls preference")).toHaveTextContent("true");
      expect(screen.getByLabelText("Saved maximum cards")).toHaveTextContent("10");
      expect(screen.getByLabelText("Saved autoplay interval")).toHaveTextContent("10");
      expect(screen.getByLabelText("Saved language preference")).toHaveTextContent("ja");
      expect(screen.getByLabelText("Saved dark mode preference")).toHaveTextContent("true");
    });
  });

  it("preserves saved slider values when another setting changes", async () => {
    // Given: Saved numeric preferences differ from the browser's range defaults.
    updatePreferences({ study: { maxNumberOfCardsToLearn: 0, cardInterval: 3 } });
    const { unmount } = render(<PreferencesFormHarness />, { wrapper: MemoryRouter });
    expect(screen.getByRole("slider", { name: "Maximum cards" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("3");

    // When: Change an unrelated setting without touching either slider.
    await userEvent.click(screen.getByRole("checkbox", { name: "Dark mode" }));

    // Then: Autosave preserves both numeric preferences.
    expect(screen.getByLabelText("Saved dark mode preference")).toHaveTextContent("true");
    expect(screen.getByLabelText("Saved maximum cards")).toHaveTextContent("0");
    expect(screen.getByLabelText("Saved autoplay interval")).toHaveTextContent("3");

    // When: Reopen the settings form from the saved preferences.
    unmount();
    render(<PreferencesFormHarness />, { wrapper: MemoryRouter });

    // Then: Both sliders still display their saved values.
    expect(screen.getByRole("slider", { name: "Maximum cards" })).toHaveValue("0");
    expect(screen.getByRole("slider", { name: "Autoplay interval" })).toHaveValue("3");
  });

  it("preserves preferences outside the form when autosaving a changed theme", async () => {
    // Given: Use this case's inputs and any shared test setup.
    render(<PreferencesFormHarness />, { wrapper: MemoryRouter });
    act(() => {
      updatePreferences({ loadSample: false, controls: { showHelp: false } });
    });

    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(screen.getByRole("checkbox", { name: "Dark mode" }));

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => {
      expect(screen.getByLabelText("Saved dark mode preference")).toHaveTextContent("true");
      expect(screen.getByLabelText("Saved sample preference")).toHaveTextContent("false");
      expect(screen.getByLabelText("Saved help preference")).toHaveTextContent("false");
    });
  });

  it("reflects a theme change saved elsewhere in the application", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<PreferencesFormHarness />, { wrapper: MemoryRouter });
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();

    // When: Exercise `act` with the prepared inputs.
    act(() => {
      setDarkMode(true);
    });

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeChecked();
    });
  });
});
