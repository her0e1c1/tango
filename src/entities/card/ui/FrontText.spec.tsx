/**
 * @file Verifies the FrontText component through rendered content and user interactions.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { FrontText } from "./FrontText";

describe("FrontText [STUDY-BACK-TEXT-01] [STUDY-CONTROLS-06]", () => {
  it("renders reading content without a Space-activated flip button", () => {
    // Given: Prepare `onClick` and any shared test state below.
    const onClick = vi.fn();
    render(<FrontText viewMode text="Reading front" onClick={onClick} />);
    expect(screen.getByText("Reading front")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByText("Reading front"), { key: " " });
    fireEvent.keyUp(screen.getByText("Reading front"), { key: " " });
    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("preserves content and click interaction", () => {
    // Given: Prepare `onClick`, `front` and any shared test state below.
    const onClick = vi.fn();
    render(<FrontText text="A very long front without spaces: abcdefghijklmnopqrstuvwxyz" onClick={onClick} />);
    const front = screen.getByText("A very long front without spaces: abcdefghijklmnopqrstuvwxyz");

    expect(front).toHaveTextContent("A very long front without spaces");
    expect(front).toBeVisible();
    // When: Exercise `fireEvent.click` with the prepared inputs.
    fireEvent.click(front);
    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders math content", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<FrontText text="$x^2$" category="math" />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("x^2")).toBeDefined();
  });

  it("activates FrontText with Enter", () => {
    // Given: Prepare `onClick` and any shared test state below.
    const onClick = vi.fn();
    render(<FrontText text="Front" onClick={onClick} />);

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "Front" }), { key: "Enter" });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });
});
