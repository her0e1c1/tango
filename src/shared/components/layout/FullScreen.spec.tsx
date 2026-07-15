import { cleanup, fireEvent, render } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FullScreen } from "@/shared/components/layout/FullScreen";

afterEach(cleanup);

describe("FullScreen", () => {
  it("fills the dynamic viewport without screen-width overflow", () => {
    const view = render(<FullScreen className="custom-fullscreen">Fullscreen content</FullScreen>);
    const fullScreen = view.getByText("Fullscreen content");

    expect(fullScreen).toHaveClass("h-dvh", "min-h-dvh", "w-full", "bg-canvas", "overflow-hidden", "custom-fullscreen");
    expect(fullScreen).not.toHaveClass("h-screen", "w-screen");
  });

  it("uses intentional vertical scrolling without forcing horizontal scrolling", () => {
    const view = render(<FullScreen scroll>Scrollable content</FullScreen>);
    const fullScreen = view.getByText("Scrollable content");

    expect(fullScreen).toHaveClass("overflow-y-auto");
    expect(fullScreen).not.toHaveClass("overflow-scroll", "overflow-hidden");
  });

  it("preserves flex, centering, and custom class semantics", () => {
    const view = render(
      <FullScreen flex center className="custom-layout">
        Centered content
      </FullScreen>
    );
    const fullScreen = view.getByText("Centered content");

    expect(fullScreen).toHaveClass("flex", "flex-col", "items-center", "justify-center", "custom-layout");
  });

  it("preserves useButtonInteraction behavior only when clickable", () => {
    const onClick = vi.fn();
    const view = render(<FullScreen onClick={onClick}>Close fullscreen</FullScreen>);
    const fullScreen = view.getByRole("button", { name: "Close fullscreen" });

    fireEvent.keyDown(fullScreen, { key: "Enter" });
    expect(onClick).toHaveBeenCalledOnce();

    view.rerender(<FullScreen>Static fullscreen</FullScreen>);
    expect(view.queryByRole("button")).not.toBeInTheDocument();
    expect(view.getByText("Static fullscreen")).not.toHaveAttribute("tabindex");
  });
});
