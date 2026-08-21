import type React from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setDarkMode, updatePreferences, usePreferences } from "@/entities/preference";
import { createPreferences } from "@/test/factories";

import { usePreferencesFormState } from "./usePreferencesFormState";

const preferences = createPreferences({
  showHeader: false,
  showSwipeButtonList: false,
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
  const formState = usePreferencesFormState();
  const savedPreferences = usePreferences();

  return (
    <>
      <input aria-label="Show header" type="checkbox" {...formState.fields.showHeader} />
      <input aria-label="Dark mode" type="checkbox" {...formState.fields.darkMode} />
      <input aria-label="Maximum cards" type="range" {...formState.fields.maxNumberOfCardsToLearn} />
      <input aria-label="Autoplay interval" type="range" {...formState.fields.cardInterval} />
      <output aria-label="Saved header preference">{String(savedPreferences.appearance.showHeader)}</output>
      <output aria-label="Saved maximum cards">{savedPreferences.study.maxNumberOfCardsToLearn}</output>
      <output aria-label="Saved autoplay interval">{savedPreferences.study.cardInterval}</output>
    </>
  );
};

describe("usePreferencesFormState", () => {
  beforeEach(() => {
    updatePreferences(preferences);
  });

  it("saves boolean and numeric changes as the user edits them", async () => {
    render(<PreferencesFormHarness />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Show header" }));
    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: 10 },
    });
    fireEvent.change(screen.getByRole("slider", { name: "Autoplay interval" }), {
      target: { value: 10 },
    });

    await waitFor(() => {
      expect(screen.getByLabelText("Saved header preference")).toHaveTextContent("true");
      expect(screen.getByLabelText("Saved maximum cards")).toHaveTextContent("10");
      expect(screen.getByLabelText("Saved autoplay interval")).toHaveTextContent("10");
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
