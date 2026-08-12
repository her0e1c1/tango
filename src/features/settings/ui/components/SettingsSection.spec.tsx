/**
 * @file Verifies the "settings presentation" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "relates a settings section
 * to its unique heading", "relates a settings row label and description to its input id", "keeps
 * the row and control region touch friendly".
 */

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { SettingsRow, SettingsSection } from "@/features/settings/ui/components/SettingsSection";

describe("settings presentation", () => {
  it("relates a settings section to its unique heading", () => {
    render(
      <SettingsSection title="Appearance" description="Navigation and visual feedback" icon="icon">
        <div>content</div>
      </SettingsSection>
    );

    expect(screen.getByRole("region", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByText("Navigation and visual feedback")).toBeInTheDocument();
    expect(screen.getByText("icon", { selector: "[aria-hidden='true']" })).toHaveAttribute("aria-hidden", "true");
  });

  it("relates a settings row label and description to its input id", () => {
    render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" aria-describedby="dark-mode-description" />
      </SettingsRow>
    );

    expect(screen.getByText("Dark mode")).toHaveAttribute("for", "dark-mode");
    expect(screen.getByText("Use the darker Calm Focus palette")).toHaveAttribute("id", "dark-mode-description");
  });

  it("keeps the row control reachable through its label", () => {
    render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" />
      </SettingsRow>
    );

    expect(screen.getByRole("textbox", { name: "Dark mode" })).toBeVisible();
  });
});
