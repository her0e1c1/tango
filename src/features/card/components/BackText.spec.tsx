/**
 * @file Verifies the "BackText" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves plain text and
 * click behavior with long-content wrapping", "preserves code and math rendering".
 */

import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BackText } from "@/features/card/components/BackText";

describe("BackText", () => {
  afterEach(cleanup);

  it("preserves plain text and click behavior with long-content wrapping", () => {
    const onClick = vi.fn();
    const view = render(<BackText text="plain text abcdefghijklmnopqrstuvwxyz" onClick={onClick} />);
    const content = view.getByText(/plain text/);
    expect(content).toHaveClass("whitespace-pre-wrap", "break-words");
    fireEvent.click(content.parentElement as Element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves code and math rendering", () => {
    const code = render(<BackText text="const value = 1" category="typescript" code />);
    expect(code.container.querySelector("code")).toHaveTextContent("const value = 1");
    code.unmount();
    const math = render(<BackText text="$x^2$" category="math" />);
    expect(math.container.querySelector(".katex")).toBeInTheDocument();
  });
});
