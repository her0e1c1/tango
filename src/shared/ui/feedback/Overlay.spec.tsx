/** @file Verifies interactive overlays through accessible names and user actions. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Overlay } from "./Overlay";

describe("shared overlay surface", () => {
  it("reports clicks from an accessibly named overlay", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick} ariaLabel="Close overlay">
        Content
      </Overlay>
    );
    const overlay = screen.getByRole("button", { name: "Close overlay" });
    fireEvent.click(overlay);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("activates Overlay with Enter", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick}>
        Close
      </Overlay>
    );

    fireEvent.keyDown(screen.getByRole("button", { name: "Close" }), { key: "Enter" });

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not expose an aria label when non-interactive", () => {
    render(
      <Overlay position="center" ariaLabel="Decorative overlay">
        Overlay
      </Overlay>
    );

    expect(screen.getByText("Overlay")).not.toHaveAttribute("aria-label");
  });
});
