/**
 * @file Verifies the "BackText" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves plain text and
 * click behavior with long-content wrapping", "preserves code and math rendering".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { BackText } from "./BackText";

describe("BackText", () => {
  it("preserves plain text and click behavior with long-content wrapping", () => {
    const onClick = vi.fn();
    render(<BackText text="plain text abcdefghijklmnopqrstuvwxyz" onClick={onClick} />);
    const content = screen.getByText(/plain text/);
    expect(content).toHaveClass("whitespace-pre-wrap", "break-words");
    fireEvent.click(content);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves code and math rendering", () => {
    const { unmount } = render(<BackText text="const value = 1" category="typescript" code />);
    expect(screen.getByText(/value =/)).toHaveTextContent("const value = 1");
    unmount();
    render(<BackText text="$x^2$" category="math" />);
    expect(screen.getByText("x^2")).toBeDefined();
  });
});
