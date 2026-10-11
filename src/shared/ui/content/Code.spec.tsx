import { StrictMode } from "react";
import { render, screen, within } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it } from "vitest";

import { Code } from "./Code";

describe("CARD-MANAGEMENT-16 Code language changes", () => {
  it.each([
    { first: "typescript", second: "python", text: "def greet():\n    return True", keyword: "def" },
    { first: "python", second: "typescript", text: "interface Greeting { value: string; }", keyword: "interface" },
    { first: "ts", second: "py", text: "def greet():\n    return True", keyword: "def" },
  ])("uses the current grammar when switching $first to $second and back", ({ first, second, text, keyword }) => {
    const view = render(
      <StrictMode>
        <Code text={text} category={first} />
      </StrictMode>
    );
    const code = screen.getByRole("code");

    for (const category of [second, first, second]) {
      view.rerender(
        <StrictMode>
          <Code text={text} category={category} />
        </StrictMode>
      );
      expect(screen.getByRole("code")).toBe(code);
      expect(code.textContent).toBe(text);
    }

    expect(within(code).getByText(keyword)).toHaveClass("hljs-keyword");
    expect(code).toHaveClass(`language-${second === "py" ? "python" : second}`);
    expect([...code.classList].filter((name) => name.startsWith("language-"))).toHaveLength(1);
  });

  it("preserves source, caller classes, and other elements across text and theme changes", () => {
    const content = (text: string, dark = false) => (
      <>
        <code className="language-typescript">const outside = true;</code>
        <Code text={text} category="python" dark={dark} />
      </>
    );
    const view = render(content("def first():\n    return True"));
    const [outside, code] = screen.getAllByRole("code");
    if (code === undefined) throw new Error("Missing code block");
    code.classList.add("caller-decoration", "hljs-custom-theme");
    const text = 'def second():\n    return "<span>source</span>"';

    view.rerender(content(text, true));

    expect(screen.getAllByRole("code")[1]).toBe(code);
    expect(code.textContent).toBe(text);
    expect(within(code).getByText("def")).toHaveClass("hljs-keyword");
    expect(code).toHaveClass("language-python", "block", "min-w-max", "caller-decoration", "hljs-custom-theme");
    expect(code).toHaveAttribute("data-theme", "dark");
    expect(outside).not.toHaveClass("hljs");
    expect(outside).toHaveTextContent("const outside = true;");

    code.classList.add("language-caller-decoration");
    view.unmount();

    expect(code).toHaveClass(
      "block",
      "min-w-max",
      "caller-decoration",
      "hljs-custom-theme",
      "language-caller-decoration"
    );
    expect(code).not.toHaveClass("hljs");
    expect(code).not.toHaveClass("language-python");
    expect(code).not.toHaveAttribute("data-highlighted");
    expect(code.textContent).toBe(text);
  });
});
