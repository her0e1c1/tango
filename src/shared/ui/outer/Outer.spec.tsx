import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";

import { Outer } from "./Outer";

describe("SETTINGS-04 Outer", () => {
  it("updates its accessible name without remounting its content", async () => {
    // Given: Prepare `shell`, `draft` and any shared test state below.
    render(
      <Outer>
        <input aria-label="Draft" defaultValue="preserved" />
      </Outer>
    );
    const shell = screen.getByRole("region", { name: "Application shell" });
    const draft = screen.getByRole("textbox", { name: "Draft" });

    // When: Exercise `getI18n().changeLanguage` with the prepared inputs.
    await getI18n().changeLanguage("ja");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("region", { name: "アプリケーションシェル" })).toBe(shell);
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("preserved");
  });
});
