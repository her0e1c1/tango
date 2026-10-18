import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { SettingsRow, SettingsSection } from "./SettingsSection";

describe("settings presentation", () => {
  it("relates a settings section to its unique heading", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <SettingsSection title="Appearance" description="Study controls and visual feedback" icon="icon">
        <div>content</div>
      </SettingsSection>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByText("Study controls and visual feedback")).toBeInTheDocument();
    expect(screen.getByText("icon", { selector: "[aria-hidden='true']" })).toHaveAttribute("aria-hidden", "true");
  });

  it("relates a settings row label and description to its input id", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" aria-describedby="dark-mode-description" />
      </SettingsRow>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Dark mode")).toHaveAttribute("for", "dark-mode");
    expect(screen.getByText("Use the darker Calm Focus palette")).toHaveAttribute("id", "dark-mode-description");
  });

  it("keeps the row control reachable through its label", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" />
      </SettingsRow>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("textbox", { name: "Dark mode" })).toBeVisible();
  });
});
