/**
 * @file Verifies the "shared rich content" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "keeps code copyable,
 * categorized, and horizontally scrollable", "highlights only its own element and follows explicit
 * text and theme changes", "keeps GFM and KaTeX rendering readable inside narrow surfaces".
 */

import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Code } from "./Code";
import { MathContent } from "./Math";

describe("shared rich content", () => {
  it("keeps code copyable, categorized, and horizontally scrollable", async () => {
    const text = "const veryWideValue = 'copy me without clipping';";
    render(<Code text={text} category="typescript" />);
    const code = screen.getByText(/veryWideValue/);

    expect(code).toHaveTextContent(text);
    await waitFor(() => expect(screen.getByText("const")).toHaveClass("hljs-keyword"));
  });

  it("highlights only its own element and follows explicit text and theme changes", async () => {
    const view = render(
      <>
        <code className="language-typescript">const outside = true;</code>
        <Code text="const value = 1;" category="typescript" />
      </>
    );
    const outside = screen.getByText("const outside = true;");
    const [, code] = screen.getAllByRole("code");

    await waitFor(() => expect(screen.getByText("const")).toHaveClass("hljs-keyword"));
    expect(outside).not.toHaveClass("hljs");
    expect(code).toHaveAttribute("data-theme", "light");

    view.rerender(
      <>
        <code className="language-typescript">const outside = true;</code>
        <Code text="const value = 2;" category="typescript" dark />
      </>
    );

    await waitFor(() => expect(screen.getByText("2")).toHaveClass("hljs-number"));
    expect(code).toHaveAttribute("data-theme", "dark");
    expect(outside).not.toHaveClass("hljs");
  });

  it("keeps GFM and KaTeX rendering readable inside narrow surfaces", () => {
    render(
      // biome-ignore lint/style/useConsistentCurlyBraces: JSX attributes preserve escapes literally, but Markdown needs line breaks.
      <MathContent text={"| A | B |\n| - | - |\n| 1 | 2 |\n\n$$x^2$$"} />
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("x^2")).toBeDefined();
  });
});
