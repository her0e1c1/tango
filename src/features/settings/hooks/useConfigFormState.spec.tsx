/**
 * @file Verifies the "ConfigForm with useConfigFormState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits boolean and
 * numeric field changes", "synchronizes dark mode when the config prop changes".
 */

import type { ConfigState } from "@/shared/config";

import type React from "react";

import userEvent from "@testing-library/user-event";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect, it, describe, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { ConfigForm } from "@/features/settings/components/ConfigForm";
import { useConfigFormState } from "@/features/settings/hooks/useConfigFormState";

/**
 * Renders the test-only Config Form Harness component with controlled state or providers.
 * Individual tests reuse it to exercise realistic interactions without repeating setup code.
 */
const ConfigFormHarness: React.FC<{
  config: ConfigState;
  onSubmit: (config: ConfigState) => void;
}> = ({ config, onSubmit }) => {
  const configForm = useConfigFormState({ config, onSubmit });
  return <ConfigForm {...configForm} />;
};

import { createConfig } from "@/test/factories";

describe("ConfigForm with useConfigFormState", () => {
  const config = createConfig({
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
    render(<ConfigFormHarness config={config} onSubmit={onSubmit} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Show header" }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...config,
        appearance: { ...config.appearance, showHeader: true },
      });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Maximum cards" }), {
      target: { value: 10 },
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...config,
        appearance: { ...config.appearance, showHeader: true },
        study: { ...config.study, maxNumberOfCardsToLearn: 10 },
      });
    });

    fireEvent.change(screen.getByRole("slider", { name: "Autoplay interval" }), { target: { value: 10 } });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...config,
        appearance: { ...config.appearance, showHeader: true },
        study: { ...config.study, maxNumberOfCardsToLearn: 10, cardInterval: 10 },
      });
    });
  });

  it("synchronizes dark mode when the config prop changes", async () => {
    const onSubmit = vi.fn();
    const { rerender } = render(<ConfigFormHarness config={config} onSubmit={onSubmit} />);
    const darkModeInput = screen.getByRole("checkbox", { name: "Dark mode" });
    expect(darkModeInput).not.toBeChecked();

    const updatedConfig = { ...config, appearance: { ...config.appearance, darkMode: true } };
    rerender(<ConfigFormHarness config={updatedConfig} onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(darkModeInput).toBeChecked();
      expect(onSubmit).toHaveBeenLastCalledWith(updatedConfig);
    });
  });
});
