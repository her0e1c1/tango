import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { SettingsRow, SettingsSection } from "@/features/settings/components/SettingsSection";

afterEach(cleanup);

describe("settings presentation", () => {
  it("relates a settings section to its unique heading", () => {
    render(
      <SettingsSection title="Appearance" description="Navigation and visual feedback" icon={<span>icon</span>}>
        <div>content</div>
      </SettingsSection>
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Appearance" });
    expect(heading.closest("section")).toHaveAttribute("aria-labelledby", heading.id);
    expect(screen.getByText("Navigation and visual feedback")).toBeInTheDocument();
    expect(screen.getByText("icon").parentElement).toHaveAttribute("aria-hidden", "true");
  });

  it("relates a settings row label and description to its input id", () => {
    render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" aria-describedby="dark-mode-description" />
      </SettingsRow>
    );

    expect(screen.getByText("Dark mode")).toHaveAttribute("for", "dark-mode");
    expect(screen.getByText("Use the darker Calm Focus palette")).toHaveAttribute(
      "id",
      "dark-mode-description"
    );
  });

  it("keeps the row and control region touch friendly", () => {
    const view = render(
      <SettingsRow inputId="dark-mode" label="Dark mode" description="Use the darker Calm Focus palette">
        <input id="dark-mode" />
      </SettingsRow>
    );

    expect(view.container.firstElementChild).toHaveClass("min-h-touch");
    expect(view.container.querySelector("input")?.parentElement).toHaveClass("shrink-0");
  });
});
