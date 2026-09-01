import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";

import { Outer } from "./Outer";

describe("SETTINGS-04 Outer", () => {
  it("updates its accessible name without remounting its content", async () => {
    render(
      <Outer>
        <input aria-label="Draft" defaultValue="preserved" />
      </Outer>
    );
    const shell = screen.getByRole("region", { name: "Application shell" });
    const draft = screen.getByRole("textbox", { name: "Draft" });

    await getI18n().changeLanguage("ja");

    expect(screen.getByRole("region", { name: "アプリケーションシェル" })).toBe(shell);
    expect(screen.getByRole("textbox", { name: "Draft" })).toBe(draft);
    expect(draft).toHaveValue("preserved");
  });
});
