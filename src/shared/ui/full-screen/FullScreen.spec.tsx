/**
 * @file Verifies the "FullScreen" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "fills the dynamic viewport
 * without screen-width overflow", "uses intentional vertical scrolling without forcing horizontal
 * scrolling", "preserves flex, centering, and custom class semantics".
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { FullScreen } from "./FullScreen";

describe("FullScreen", () => {
  it("fills the dynamic viewport without screen-width overflow", () => {
    render(<FullScreen className="custom-fullscreen">Fullscreen content</FullScreen>);
    const fullScreen = screen.getByText("Fullscreen content");

    expect(fullScreen).toHaveClass("h-dvh", "min-h-dvh", "w-full", "bg-canvas", "overflow-hidden", "custom-fullscreen");
    expect(fullScreen).not.toHaveClass("h-screen", "w-screen");
  });

  it("uses intentional vertical scrolling without forcing horizontal scrolling", () => {
    render(<FullScreen scroll>Scrollable content</FullScreen>);
    const fullScreen = screen.getByText("Scrollable content");

    expect(fullScreen).toHaveClass("overflow-x-hidden", "overflow-y-auto");
    expect(fullScreen).not.toHaveClass("overflow-scroll", "overflow-hidden");
  });

  it("preserves flex, centering, and custom class semantics", () => {
    render(
      <FullScreen flex center className="custom-layout">
        Centered content
      </FullScreen>
    );
    const fullScreen = screen.getByText("Centered content");

    expect(fullScreen).toHaveClass("flex", "flex-col", "items-center", "justify-center", "custom-layout");
  });

  it("preserves useButtonInteraction behavior only when clickable", () => {
    const onClick = vi.fn();
    const view = render(<FullScreen onClick={onClick}>Close fullscreen</FullScreen>);
    const fullScreen = screen.getByRole("button", { name: "Close fullscreen" });

    fireEvent.keyDown(fullScreen, { key: "Enter" });
    expect(onClick).toHaveBeenCalledOnce();

    view.rerender(<FullScreen>Static fullscreen</FullScreen>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Static fullscreen")).not.toHaveAttribute("tabindex");
  });
});
