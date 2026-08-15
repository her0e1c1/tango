import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { SettingsSection } from "./SettingsSection";
import { SettingsRowFixture } from "./SettingsRowFixture";

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
    render(<SettingsRowFixture described />);

    const input = screen.getByRole("textbox", { name: "Dark mode" });
    expect(screen.getByText("Dark mode")).toHaveAttribute("for", input.id);
    expect(screen.getByText("Use the darker Calm Focus palette")).toHaveAttribute(
      "id",
      input.getAttribute("aria-describedby")
    );
  });

  it("keeps the row control reachable through its label", () => {
    render(<SettingsRowFixture />);

    expect(screen.getByRole("textbox", { name: "Dark mode" })).toBeVisible();
  });
});
