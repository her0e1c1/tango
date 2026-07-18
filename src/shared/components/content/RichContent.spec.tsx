import { cleanup, render, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it } from "vitest";

import { Code } from "@/shared/components/content/Code";
import { MathContent } from "@/shared/components/content/Math";

afterEach(cleanup);

describe("shared rich content", () => {
  it("keeps code copyable, categorized, and horizontally scrollable", async () => {
    const text = "const veryWideValue = 'copy me without clipping';";
    const view = render(<Code text={text} category="typescript" />);
    const pre = view.container.querySelector("pre");
    const code = view.container.querySelector("code");

    expect(pre).toHaveClass("typescript", "max-w-full", "overflow-x-auto", "bg-surface-muted");
    expect(code).toHaveTextContent(text);
    expect(code).toHaveAttribute("data-theme", "light");
    await waitFor(() => expect(code).toHaveClass("hljs"));
  });

  it("highlights only its own element and follows explicit text and theme changes", async () => {
    const outside = document.createElement("code");
    outside.className = "language-typescript";
    outside.textContent = "const outside = true;";
    document.body.append(outside);
    const view = render(<Code text="const value = 1;" category="typescript" />);
    const code = view.container.querySelector("code");

    await waitFor(() => expect(code).toHaveClass("hljs"));
    expect(outside).not.toHaveClass("hljs");

    view.rerender(<Code text="const value = 2;" category="typescript" dark />);

    await waitFor(() => expect(code).toHaveTextContent("const value = 2;"));
    expect(code).toHaveAttribute("data-theme", "dark");
    outside.remove();
  });

  it("keeps GFM and KaTeX rendering readable inside narrow surfaces", () => {
    const view = render(<MathContent text={"| A | B |\n| - | - |\n| 1 | 2 |\n\n$$x^2$$"} />);
    const wrapper = view.container.firstElementChild;

    expect(wrapper).toHaveClass("markdown-body", "max-w-full", "overflow-x-auto", "bg-surface");
    expect(view.container.querySelector("table")).toBeInTheDocument();
    expect(view.container.querySelector(".katex")).toBeInTheDocument();
  });
});
