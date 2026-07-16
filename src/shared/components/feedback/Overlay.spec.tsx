import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { Overlay } from "@/shared/components/feedback/Overlay";

afterEach(cleanup);

describe("shared overlay surface", () => {
  it("uses a shared backdrop and constrained scrolling for center content", () => {
    render(<Overlay position="center">Long overlay content</Overlay>);
    const overlay = screen.getByText("Long overlay content");
    expect(overlay).toHaveClass(
      "inset-0",
      "overflow-x-hidden",
      "overflow-y-auto",
      "bg-surface-elevated",
      "text-ink",
      "shadow-elevated"
    );
    expect(overlay).toHaveClass("before:bg-canvas/70");
  });

  it.each([
    ["left", "inset-y-0", "left-0"],
    ["right", "inset-y-0", "right-0"],
    ["top", "inset-x-0", "top-0"],
    ["bottom", "inset-x-0", "bottom-0"],
  ] as const)("retains the %s position contract", (position, insetClass, edgeClass) => {
    render(<Overlay position={position}>Overlay</Overlay>);
    expect(screen.getByText("Overlay")).toHaveClass(insetClass, edgeClass);
  });

  it("retains click, accessible name, custom class, and shared focus appearance", () => {
    const onClick = vi.fn();
    render(
      <Overlay position="center" onClick={onClick} ariaLabel="Close overlay" className="custom-overlay">
        Content
      </Overlay>
    );
    const overlay = screen.getByRole("button", { name: "Close overlay" });
    expect(overlay).toHaveClass("custom-overlay", "focus-visible:outline-focus");
    fireEvent.click(overlay);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
