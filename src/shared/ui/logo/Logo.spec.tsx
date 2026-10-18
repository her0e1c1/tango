/**
 * @file Verifies the "Logo" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as rendering the brand wordmark
 * or mark and supporting keyboard accessibility when interactive.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders the accessible brand label", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<Logo />);
    // Then: Verify the expected result in the assertions below.
    expect(screen.getByText("tango")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("activates Logo with Enter when interactive", () => {
    // Given: Prepare `onClick` and any shared test state below.
    const onClick = vi.fn();
    render(<Logo onClick={onClick} />);

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "tango" }), { key: "Enter" });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });
});
