import type React from "react";

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";

import { setDarkMode, updatePreferences, usePreferences } from "@/entities/preferences";
import { createPreferences } from "@/test/factories";

import { SettingsForm } from "../../ui/components/SettingsForm";
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

const SettingsFormHarness: React.FC = () => {
  const formState = usePreferencesFormState();
  const savedPreferences = usePreferences();

  return (
    <>
      <SettingsForm {...formState} />
      <output aria-label="Saved header preference">{String(savedPreferences.appearance.showHeader)}</output>
      <output aria-label="Saved maximum cards">{savedPreferences.study.maxNumberOfCardsToLearn}</output>
      <output aria-label="Saved autoplay interval">{savedPreferences.study.cardInterval}</output>
    </>
  );
};

describe("SettingsForm with usePreferencesFormState", () => {
  beforeEach(() => {
    updatePreferences(preferences);
  });

  it("saves boolean and numeric changes as the user edits them", async () => {
    render(<SettingsFormHarness />);

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
    render(<SettingsFormHarness />);
    expect(screen.getByRole("checkbox", { name: "Dark mode" })).not.toBeChecked();

    act(() => {
      setDarkMode(true);
    });

    await waitFor(() => {
      expect(screen.getByRole("checkbox", { name: "Dark mode" })).toBeChecked();
    });
  });
});
