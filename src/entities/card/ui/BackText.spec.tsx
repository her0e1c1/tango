/**
 * @file Verifies the "BackText" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "preserves plain text and
 * click behavior", "preserves code and math rendering".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";
import { BackText } from "./BackText";

describe("BackText", () => {
  it("preserves plain text and click behavior", () => {
    // Given: Prepare `onClick`, `content` and any shared test state below.
    const onClick = vi.fn();
    render(<BackText text="plain text abcdefghijklmnopqrstuvwxyz" onClick={onClick} />);
    const content = screen.getByText(/plain text/);
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(content);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves code and math rendering", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    const { unmount } = render(<BackText text="const value = 1" category="typescript" code />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText(/value =/)).toHaveTextContent("const value = 1");
    // When: Exercise `unmount` with the prepared inputs.
    unmount();
    render(<BackText text="$x^2$" category="math" />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("x^2")).toBeDefined();
  });
});
