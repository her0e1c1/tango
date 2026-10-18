/**
 * @file Verifies the "useButtonInteraction" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as Enter activation, Space bar
 * press/release lifecycle, blur cancellation, and event delegation isolation.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, it, vi } from "vitest";

import { useButtonInteraction } from "./buttonInteraction";

function TestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return <div {...props}>Test Button</div>;
}

function NestedTestButton({ onClick }: { onClick?: () => void }) {
  const props = useButtonInteraction(onClick);
  return (
    <div {...props}>
      <input aria-label="Nested input" />
    </div>
  );
}

describe("useButtonInteraction", () => {
  it("activates a custom button once for a direct Enter key press", () => {
    // Given: Prepare `onClick`, `button` and any shared test state below.
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(button, { key: "Enter" });
    fireEvent.keyDown(button, { key: "Enter", repeat: true });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("prevents scrolling on Space keydown and activates once on keyup", () => {
    // Given: Prepare `onClick`, `button` and any shared test state below.
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    // When: Evaluate `fireEvent.keyDown` as part of the following checks.
    // Then: Verify the expected result in the assertions below.
    expect(fireEvent.keyDown(button, { key: " " })).toBe(false);
    expect(fireEvent.keyDown(button, { key: " ", repeat: true })).toBe(false);
    expect(onClick).not.toHaveBeenCalled();
    // When: Exercise `fireEvent.keyUp` with the prepared inputs.
    fireEvent.keyUp(button, { key: " " });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("preserves a pending Space activation across rerenders", () => {
    // Given: Prepare `onClick`, `view` and any shared test state below.
    const onClick = vi.fn();
    const view = render(<TestButton onClick={onClick} />);

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(screen.getByRole("button", { name: "Test Button" }), { key: " " });
    view.rerender(<TestButton onClick={onClick} />);
    fireEvent.keyUp(screen.getByRole("button", { name: "Test Button" }), { key: " " });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("cancels a pending Space activation on blur", () => {
    // Given: Prepare `onClick`, `button` and any shared test state below.
    const onClick = vi.fn();
    render(<TestButton onClick={onClick} />);
    const button = screen.getByRole("button", { name: "Test Button" });

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(button, { key: " " });
    fireEvent.blur(button);
    fireEvent.keyUp(button, { key: " " });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not activate a custom button from descendant keyboard events", () => {
    // Given: Prepare `onClick`, `input` and any shared test state below.
    const onClick = vi.fn();
    render(<NestedTestButton onClick={onClick} />);
    const input = screen.getByRole("textbox", { name: "Nested input" });

    // When: Exercise `fireEvent.keyDown` with the prepared inputs.
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: " " });
    fireEvent.keyUp(input, { key: " " });

    // Then: Verify the expected result in the assertions below.
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not expose non-interactive containers as buttons", () => {
    // Given: Use this case's inputs and any shared test setup.
    // When: Exercise `render` with the prepared inputs.
    render(<TestButton />);

    // Then: Verify the expected result in the assertions below.
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByText("Test Button")).not.toHaveAttribute("tabindex");
  });
});
