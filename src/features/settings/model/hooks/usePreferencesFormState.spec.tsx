/**
 * @file Verifies the "PreferencesForm with usePreferencesFormState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits boolean and
 * numeric field changes", "synchronizes dark mode when the preferences prop changes".
 */

import type { Preferences } from "@/entities/preferences";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, describe, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { PreferencesForm } from "../../ui/components/PreferencesForm";
import { usePreferencesFormState } from "./usePreferencesFormState";

/**
 * Renders the test-only Preferences Form Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const PreferencesFormHarness: React.FC<{
  preferences: Preferences;
  onSubmit: (preferences: Preferences) => void;
}> = ({ preferences, onSubmit }) => {
  const preferencesForm = usePreferencesFormState({ preferences, onSubmit });
  return <PreferencesForm {...preferencesForm} />;
};

import { createPreferences } from "@/test/factories";

describe("PreferencesForm with usePreferencesFormState", () => {
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
    render(<PreferencesFormHarness preferences={preferences} onSubmit={onSubmit} />);

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
    const { rerender } = render(<PreferencesFormHarness preferences={preferences} onSubmit={onSubmit} />);
    const darkModeInput = screen.getByRole("checkbox", { name: "Dark mode" });
    expect(darkModeInput).not.toBeChecked();

    const updatedPreferences = { ...preferences, appearance: { ...preferences.appearance, darkMode: true } };
    rerender(<PreferencesFormHarness preferences={updatedPreferences} onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(darkModeInput).toBeChecked();
      expect(onSubmit).toHaveBeenLastCalledWith(updatedPreferences);
    });
  });
});
