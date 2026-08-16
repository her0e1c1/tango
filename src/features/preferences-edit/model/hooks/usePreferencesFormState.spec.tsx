import type { Preferences } from "@/entities/preferences";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, describe, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

const mocks = vi.hoisted(() => ({
  preferences: undefined as Preferences | undefined,
  onSubmit: (() => undefined) as (preferences: Preferences) => void,
}));

vi.mock("@/entities/preferences", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/preferences")>()),
  usePreferences: () => mocks.preferences,
  updatePreferences: (preferences: Preferences) => mocks.onSubmit(preferences),
}));

import { SettingsForm } from "../../ui/components/SettingsForm";
import { usePreferencesFormState } from "./usePreferencesFormState";

const SettingsFormHarness: React.FC = () => {
  const formState = usePreferencesFormState();
  return <SettingsForm {...formState} />;
};

const renderSettingsForm = (preferences: Preferences, onSubmit: (preferences: Preferences) => void) => {
  mocks.preferences = preferences;
  mocks.onSubmit = onSubmit;
  return render(<SettingsFormHarness />);
};

import { createPreferences } from "@/test/factories";

describe("SettingsForm with usePreferencesFormState", () => {
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

  it("auto-submits boolean and numeric field changes", async () => {
    const onSubmit = vi.fn();
    renderSettingsForm(preferences, onSubmit);

    await userEvent.click(screen.getByRole("checkbox", { name: "Show header" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...preferences,
        appearance: { ...preferences.appearance, showHeader: true },
      });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: 10 },
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...preferences,
        appearance: { ...preferences.appearance, showHeader: true },
        study: { ...preferences.study, maxNumberOfCardsToLearn: 10 },
      });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Autoplay interval" }), { target: { value: 10 } });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...preferences,
        appearance: { ...preferences.appearance, showHeader: true },
        study: { ...preferences.study, maxNumberOfCardsToLearn: 10, cardInterval: 10 },
      });
    });
  });

  it("synchronizes dark mode when the preferences prop changes", async () => {
    const onSubmit = vi.fn();
    const { rerender } = renderSettingsForm(preferences, onSubmit);
    const darkModeInput = screen.getByRole("checkbox", { name: "Dark mode" });
    expect(darkModeInput).not.toBeChecked();

    const updatedPreferences = { ...preferences, appearance: { ...preferences.appearance, darkMode: true } };
    mocks.preferences = updatedPreferences;
    rerender(<SettingsFormHarness />);

    await waitFor(() => {
      expect(darkModeInput).toBeChecked();
      expect(onSubmit).toHaveBeenLastCalledWith(updatedPreferences);
    });
  });
});
