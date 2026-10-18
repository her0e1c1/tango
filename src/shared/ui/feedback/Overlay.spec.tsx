/** @file Verifies interactive overlays through accessible names and user actions. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Overlay } from "./Overlay";

describe("shared overlay surface", () => {
  it("reports clicks from an accessibly named overlay", () => {
    // Given: Prepare `onClick`, `overlay` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick} ariaLabel="Close overlay">
        Content
      </Overlay>
    );
    const overlay = screen.getByRole("button", { name: "Close overlay" });
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(overlay);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates Overlay with Enter", () => {
    // Given: Prepare `onClick` and any shared test state below.
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Enter" });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not expose an aria label when non-interactive", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(
      <Overlay position="center" ariaLabel="Decorative overlay">
        Overlay
      </Overlay>
    );

    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("Overlay")).not.toHaveAttribute("aria-label");
  });
});
