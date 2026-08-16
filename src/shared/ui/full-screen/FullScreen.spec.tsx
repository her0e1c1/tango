/** @file Verifies FullScreen interaction behavior through its accessible interface. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { FullScreen } from "./FullScreen";

describe("FullScreen", () => {
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
