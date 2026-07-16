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

  it("keeps GFM and KaTeX rendering readable inside narrow surfaces", () => {
    const view = render(<MathContent text={"| A | B |\n| - | - |\n| 1 | 2 |\n\n$$x^2$$"} />);
    const wrapper = view.container.firstElementChild;

    expect(wrapper).toHaveClass("markdown-body", "max-w-full", "overflow-x-auto", "bg-surface");
    expect(view.container.querySelector("table")).toBeInTheDocument();
    expect(view.container.querySelector(".katex")).toBeInTheDocument();
  });
});
