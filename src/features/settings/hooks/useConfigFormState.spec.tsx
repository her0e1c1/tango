/**
 * @file Verifies the "ConfigForm with useConfigFormState" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "auto-submits boolean and
 * numeric field changes", "synchronizes dark mode when the config prop changes".
 */

import type React from "react";

import userEvent from "@testing-library/user-event";
import { render, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { expect, it, describe, vi, afterEach } from "vitest";
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

describe("ConfigForm with useConfigFormState", () => {
  afterEach(() => {
    cleanup();
  });
  const config = {
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
    githubAccessToken: "",
  } as ConfigState;
  it("auto-submits boolean and numeric field changes", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigFormHarness config={config} onSubmit={onSubmit} />);

    await userEvent.click(c.container.querySelector("input[name='showHeader']") as Element);
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...config, showHeader: true });
    });

    fireEvent.change(c.container.querySelector("input[name='maxNumberOfCardsToLearn']") as Element, {
      target: { value: 10 },
    });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({ ...config, showHeader: true, maxNumberOfCardsToLearn: 10 });
    });

    fireEvent.change(c.container.querySelector("input[name='cardInterval']") as Element, { target: { value: 10 } });
    await waitFor(() => {
      expect(onSubmit).toHaveBeenLastCalledWith({
        ...config,
        showHeader: true,
        maxNumberOfCardsToLearn: 10,
        cardInterval: 10,
      });
    });
  });

  it("synchronizes dark mode when the config prop changes", async () => {
    const onSubmit = vi.fn();
    const c = render(<ConfigFormHarness config={config} onSubmit={onSubmit} />);
    const darkModeInput = c.container.querySelector("input[name='darkMode']") as HTMLInputElement;
    expect(darkModeInput).not.toBeChecked();

    c.rerender(<ConfigFormHarness config={{ ...config, darkMode: true }} onSubmit={onSubmit} />);

    await waitFor(() => {
      expect(darkModeInput).toBeChecked();
      expect(onSubmit).toHaveBeenLastCalledWith({ ...config, darkMode: true });
    });
  });
});
