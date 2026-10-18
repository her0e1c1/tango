import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("SETTINGS-04 Button", () => {
  it("updates its loading announcement without changing its label or remounting", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Button loading>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });
    const status = screen.getByRole("status");
    // Then: Verify the expected result in the assertions below.
    expect(status).toHaveTextContent("Loading Continue");

    // When: Exercise `getI18n().changeLanguage` with the prepared inputs.
    await getI18n().changeLanguage("ja");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("button", { name: "Continue" })).toBe(button);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("処理中：Continue");
  });
});
