import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";

import { Button } from "./Button";

describe("SETTINGS-04 Button", () => {
  it("updates its loading announcement without changing its label or remounting", async () => {
    render(<Button loading>Continue</Button>);
    const button = screen.getByRole("button", { name: "Continue" });
    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Loading Continue");

    await getI18n().changeLanguage("ja");

    expect(screen.getByRole("button", { name: "Continue" })).toBe(button);
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent("処理中：Continue");
  });
});
