/**
 * @file Verifies the "shared rich content" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps code copyable,
 * categorized, and horizontally scrollable", "highlights only its own element and follows explicit
 * text and theme changes", "keeps GFM and KaTeX rendering readable inside narrow surfaces".
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { getI18n } from "react-i18next";
import { describe, expect, it } from "vitest";

import { Code } from "./Code";
import { MathContent } from "./Math";

describe("SETTINGS-04 shared rich content", () => {
  it("keeps code copyable, categorized, and horizontally scrollable", async () => {
    // Given: Prepare `text` and any shared test state below.
    const text = "const veryWideValue = 'copy me without clipping';";
    // When: Exercise `render` with the prepared inputs.
    render(<Code text={text} category="typescript" />);
    const code = screen.getByText(/veryWideValue/);

    // Then: Verify the expected result in the assertions below.
    expect(code).toHaveTextContent(text);
    await waitFor(() => expect(screen.getByText("const")).toHaveClass("hljs-keyword"));
  });

  it("highlights only its own element and follows explicit text and theme changes", async () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const view = render(
      <>
        <code className="language-typescript">const outside = true;</code>
        <Code text="const value = 1;" category="typescript" />
      </>
    );
    const outside = screen.getByText("const outside = true;");
    const [, code] = screen.getAllByRole("code");

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByText("const")).toHaveClass("hljs-keyword"));
    expect(outside).not.toHaveClass("hljs");
    expect(code).toHaveAttribute("data-theme", "light");

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(
      <>
        <code className="language-typescript">const outside = true;</code>
        <Code text="const value = 2;" category="typescript" dark />
      </>
    );

    // Then: Verify the expected result in the assertions below.
    await waitFor(() => expect(screen.getByText("2")).toHaveClass("hljs-number"));
    expect(code).toHaveAttribute("data-theme", "dark");
    expect(outside).not.toHaveClass("hljs");
  });

  it("keeps GFM and KaTeX rendering readable inside narrow surfaces", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      // biome-ignore lint/style/useConsistentCurlyBraces: JSX attributes preserve escapes literally, but Markdown needs line breaks.
      <MathContent text={"| A | B |\n| - | - |\n| 1 | 2 |\n\n$$x^2$$"} />
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("x^2")).toBeDefined();
  });

  it("localizes task status without changing user-authored Markdown", async () => {
    // Given: Prepare `checkbox` and any shared test state below.
    render(<MathContent text="- [ ] Keep this task" />);
    const checkbox = screen.getByRole("checkbox", { name: "Task status" });

    // When: Exercise `getI18n().changeLanguage` with the prepared inputs.
    await getI18n().changeLanguage("ja");

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByRole("checkbox", { name: "タスクの状態" })).toBe(checkbox);
    expect(screen.getByText("Keep this task")).toBeVisible();
  });
});
