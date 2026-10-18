/** @file Verifies FullScreen interaction behavior through its accessible interface. */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { FullScreen } from "./FullScreen";

describe("FullScreen", () => {
  it("preserves useButtonInteraction behavior only when clickable", () => {
    // Given: Prepare `onClick`, `view`, `fullScreen` and any shared test state below.
    const onClick = vi.fn();
    const view = render(<FullScreen onClick={onClick}>Close fullscreen</FullScreen>);
    const fullScreen = screen.getByRole("button", { name: "Close fullscreen" });

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(fullScreen, { key: "Enter" });
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();

    // When: Exercise `view.rerender` with the prepared inputs.
    view.rerender(<FullScreen>Static fullscreen</FullScreen>);
    // Then: Verify the expected result in the assertions below.
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Static fullscreen")).not.toHaveAttribute("tabindex");
  });
});
